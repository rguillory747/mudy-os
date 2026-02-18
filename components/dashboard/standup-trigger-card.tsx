'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Users, Play, Loader2, CheckCircle, ListTodo } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface StandupResult {
  summary: {
    reportsGenerated: number
    actionItemsCreated: number
    tasksCreated: number
    totalTokens: number
    totalCostCents: number
  }
  reports: Array<{
    roleName: string
    completedWork: string
    blockers: string
    nextPriorities: string
  }>
  aggregation: string
  taskIds: string[]
}

export function StandupTriggerCard() {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<StandupResult | null>(null)
  const [showResults, setShowResults] = useState(false)

  const runStandup = async () => {
    try {
      setRunning(true)
      const response = await fetch('/api/standups', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      const data = await response.json()
      setResult(data)
      setShowResults(true)
      toast.success(`Standup complete! Created ${data.summary.tasksCreated} tasks`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to run standup')
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div className="flex-1">
              <h3 className="font-semibold">Autonomous Standup</h3>
              <p className="text-sm text-muted-foreground">
                Run daily standup across all agents
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={runStandup}
              disabled={running}
              className="flex-1"
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Running Standup...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Standup Now
                </>
              )}
            </Button>

            {result && (
              <Button
                variant="outline"
                onClick={() => setShowResults(true)}
              >
                View Results
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Generates reports from all active roles, aggregates insights, and creates action items automatically.</p>
          </div>
        </div>
      </Card>

      {result && (
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Standup Results</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{result.summary.reportsGenerated}</div>
                  <div className="text-xs text-muted-foreground">Reports</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{result.summary.actionItemsCreated}</div>
                  <div className="text-xs text-muted-foreground">Action Items</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">{result.summary.tasksCreated}</div>
                  <div className="text-xs text-muted-foreground">Tasks Created</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold text-primary">${(result.summary.totalCostCents / 100).toFixed(2)}</div>
                  <div className="text-xs text-muted-foreground">Cost</div>
                </Card>
              </div>

              {/* Aggregation */}
              {result.aggregation && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Executive Summary
                    </h3>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-sm whitespace-pre-wrap">{result.aggregation}</p>
                    </Card>
                  </div>
                </>
              )}

              {/* Individual Reports */}
              <Separator />
              <div>
                <h3 className="font-semibold mb-3">Team Reports</h3>
                <div className="space-y-3">
                  {result.reports.map((report, idx) => (
                    <Card key={idx} className="p-4">
                      <h4 className="font-medium mb-2">{report.roleName}</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-green-600 font-medium">✓ Completed:</span>
                          <p className="text-muted-foreground ml-4">{report.completedWork}</p>
                        </div>
                        {report.blockers !== 'None' && (
                          <div>
                            <span className="text-yellow-600 font-medium">⚠ Blockers:</span>
                            <p className="text-muted-foreground ml-4">{report.blockers}</p>
                          </div>
                        )}
                        <div>
                          <span className="text-blue-600 font-medium">→ Next:</span>
                          <p className="text-muted-foreground ml-4">{report.nextPriorities}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* View Tasks Button */}
              {result.taskIds.length > 0 && (
                <>
                  <Separator />
                  <Button
                    onClick={() => {
                      setShowResults(false)
                      router.push('/tasks')
                    }}
                    className="w-full"
                  >
                    <ListTodo className="h-4 w-4 mr-2" />
                    View Created Tasks ({result.taskIds.length})
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
