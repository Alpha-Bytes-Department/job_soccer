import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import auth from "../../shared/middlewares/auth";

const router: Router = Router();

router.post("/checkout",auth(), SubscriptionController.checkout);

export const SubscriptionRoutes = router;

