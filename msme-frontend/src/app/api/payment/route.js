import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

export async function POST(req) {
  const { id, price, name } = await req.json();

  // Initialize Midtrans Snap
  let snap = new midtransClient.Snap({
    isProduction: false,
    serverKey: 'YOUR_MIDTRANS_SERVER_KEY', // REPLACE THIS with your key from Midtrans Dashboard
  });

  let parameter = {
    transaction_details: {
      order_id: `ORDER-${id}-${Date.now()}`,
      gross_amount: price,
    },
    item_details: [{
      id: id,
      price: price,
      quantity: 1,
      name: name
    }]
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ token: transaction.token });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Payment Failed' }, { status: 500 });
  }
}