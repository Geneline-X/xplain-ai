import { createNextRouteHandler } from "uploadthing/next";
export const maxDuration = 300;
import { ourFileRouter } from "./core";
 
// Export routes for Next App Router
export const { GET, POST } = createNextRouteHandler({
  router: ourFileRouter,
});