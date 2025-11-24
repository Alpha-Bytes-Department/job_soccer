import { Router } from "express";
import { SubscriptionController } from "./subscription.controller";
import auth from "../../shared/middlewares/auth";

const router: Router = Router();

router.post("/checkout",auth(), SubscriptionController.checkout);
router.get("/current",auth(), SubscriptionController.getCurrentSubscription);

export const SubscriptionRoutes = router;

