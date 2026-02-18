import { currentUser } from "@clerk/nextjs/server";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { NextResponse } from "next/server";

import { MemoryManager } from "@/lib/memory";
import { rateLimit } from "@/lib/rate-limit";
import prismadb from "@/lib/prismadb";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await params;
    const { prompt } = await request.json();
    const user = await currentUser();

    if (!user || !user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const identifier = request.url + "-" + user.id;
    const { success } = await rateLimit(identifier);

    if (!success) {
      return new NextResponse("Rate limit exceeded", { status: 429 });
    }

    const companion = await prismadb.companion.update({
      where: {
        id: chatId
      },
      data: {
        messages: {
          create: {
            content: prompt,
            role: "user",
            userId: user.id,
          },
        },
      }
    });

    if (!companion) {
      return new NextResponse("Companion not found", { status: 404 });
    }

    const name = companion.id;
    const companion_file_name = name + ".txt";

    const companionKey = {
      companionName: name!,
      userId: user.id,
      modelName: "gpt-3.5-turbo",
    };
    const memoryManager = await MemoryManager.getInstance();
    const records = await memoryManager.readLatestHistory(companionKey);

    if (records.length === 0) {
      await memoryManager.seedChatHistory(companion.seed, "\n\n", companionKey);
    }
    await memoryManager.writeToHistory("User: " + prompt + "\n", companionKey);

    const recentChatHistory = await memoryManager.readLatestHistory(companionKey);

    const similarDocs: any = await memoryManager.vectorSearch(
      recentChatHistory,
      companion_file_name
    );

    let relevantHistory = "";
    if (similarDocs.length !== 0) {
      relevantHistory = similarDocs.map((doc: any) => doc.pageContent).join("\n");
    }

    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-3.5-turbo",
      temperature: 0.7,
      maxTokens: 2048,
    });

    model.verbose = true;

    const resp = await model.invoke([
      new HumanMessage(
        `
        ONLY generate plain sentences without a prefix of who is speaking. DO NOT use ${companion.name}: prefix.

        ${companion.instructions}

        Below are relevant details about ${companion.name}'s past and the conversation you are in.
        ${relevantHistory}

        ${recentChatHistory}\n${companion.name}:`
      )
    ]);

    const cleaned = resp.content.toString().replaceAll(",", "");
    const chunks = cleaned.split("\n");
    const response = chunks[0];

    const cleanedResponse = {
      content: response?.trim() || 'No response content available',
      error: null,
    };

    if (cleanedResponse.error) {
      console.error('Error:', cleanedResponse.error);
    }

    await memoryManager.writeToHistory(cleanedResponse.content, companionKey);

    if (cleanedResponse.content.length > 0) {
      await prismadb.companion.update({
        where: {
          id: chatId
        },
        data: {
          messages: {
            create: {
              content: cleanedResponse.content,
              role: "system",
              userId: user.id,
            },
          },
        }
      });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(encoder.encode(cleanedResponse.content));
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Internal Error:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}