import { auth } from "@clerk/nextjs/server"

import prismadb from "@/lib/prismadb"
import { getCurrentOrg } from "@/lib/tenant"
import { Categories } from "@/components/categories"
import { Companions } from "@/components/companions"
import { SearchInput } from "@/components/search-input"

interface RootPageProps {
    searchParams: Promise<{
        categoryId: string
        name: string
    }>
}

const RootPage = async ({ searchParams }: RootPageProps) => {
    const { userId } = await auth()
    const org = await getCurrentOrg()
    const { categoryId, name } = await searchParams

    const data = await prismadb.companion.findMany({
        where: {
            categoryId: categoryId,
            name: {
                contains: name,
                mode: "insensitive",
            },
            ...(org ? { orgId: org.id } : { userId: userId ?? "" }),
        },
        orderBy: {
            createdAt: "desc",
        },
        include: {
            _count: {
                select: {
                    messages: true,
                },
            },
        },
    })

    const categories = await prismadb.category.findMany()

    return (
        <div className="h-full p-4 space-y-2">
            <SearchInput />
            <Categories data={categories} />
            <Companions data={data} />
        </div>
    )
}

export default RootPage
