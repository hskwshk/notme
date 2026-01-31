import { createHonoApp } from "@/server/create-app";
import authRoute from "@/server/routes/auth";
import calendarRoute from "@/server/routes/calendar";
import dailyGoalRoute from "@/server/routes/daily-goal";
import homeRoute from "@/server/routes/home";
import notificationsRoute from "@/server/routes/notifications";

const app = createHonoApp()
	.basePath("/api")
	.route("/auth", authRoute)
	.route("/notifications", notificationsRoute)
	.route("/daily-goal", dailyGoalRoute)
	.route("/home", homeRoute)
	.route("/calendar", calendarRoute);

export type AppType = typeof app;
export { app };
