import { createCallerFactory } from "@/server/trpc"
import { appRouter } from "@/server/routers/_app"
import { auth } from "@/auth"

const createCaller = createCallerFactory(appRouter)

export async function getServerCaller() {
  const session = await auth()
  return createCaller({ session })
}
