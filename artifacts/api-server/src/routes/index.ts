import { Router, type IRouter } from "express";
import healthRouter from "./health";
import locationsRouter from "./locations";
import menuRouter from "./menu";
import testimonialsRouter from "./testimonials";
import contactRouter from "./contact";
import ordersRouter from "./orders";
import paypalRouter from "./paypal";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(locationsRouter);
router.use(menuRouter);
router.use(testimonialsRouter);
router.use(contactRouter);
router.use(ordersRouter);
router.use(paypalRouter);
router.use(adminRouter);

export default router;
