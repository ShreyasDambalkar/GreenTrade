
import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

// Initialize Razorpay with dummy keys if not provided
// USER MUST UPDATE THESE KEYS in .env.local
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
    try {
        const { amount, currency } = await req.json();

        const options = {
            amount: amount * 100, // Amount in smallest currency unit (paise)
            currency: currency || "INR",
            receipt: "receipt_" + Math.random().toString(36).substring(7),
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            success: true,
            order,
        });
    } catch (error: any) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Failed to create Razorpay order"
        }, { status: 500 });
    }
}
