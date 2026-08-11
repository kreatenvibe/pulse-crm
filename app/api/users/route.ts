import { userService } from "@/services";

export async function GET() {
  // Full collection for assignment pickers (assignedTo comboboxes).
  const users = await userService.getAll();
  return Response.json(users);
}
