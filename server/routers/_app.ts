import { router } from "../trpc"
import { recipeRouter } from "./recipe"
import { userRouter } from "./user"
import { memoryRouter } from "./memory"

export const appRouter = router({
  recipe: recipeRouter,
  user: userRouter,
  memory: memoryRouter,
})

export type AppRouter = typeof appRouter
