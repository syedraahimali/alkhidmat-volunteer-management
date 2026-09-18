"use client";

import { useEffect, useState, useActionState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Loader2, RefreshCw } from "lucide-react";
import { generateVolunteerQrAction, type QrActionState } from "@/lib/qr/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const initialState: QrActionState = {};

export function VolunteerQrCard() {
  const [state, formAction, pending] = useActionState(generateVolunteerQrAction, initialState);
  const [image, setImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!state.token) {
      return;
    }

    QRCode.toDataURL(state.token, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
      color: { dark: "#102a43", light: "#ffffff" },
    })
      .then((dataUrl) => {
        setImageError(false);
        setImage(dataUrl);
      })
      .catch(() => setImageError(true));
  }, [state.token]);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Digital identity</p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">Your volunteer QR</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Show this QR to an authorized coordinator when checking in. The underlying token hash stays protected on the
            server.
          </p>
        </div>
        <form action={formAction}>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {pending ? "Generating" : image ? "Rotate QR" : "Generate QR"}
          </Button>
        </form>
      </div>
      {image ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-lg border border-slate-200 bg-slate-50 p-5">
          {imageError ? <p className="text-sm text-red-700">The QR image could not be generated. Please try again.</p> : null}
          {!imageError ? (
            <Image src={image} alt="Your volunteer QR identity" width={256} height={256} unoptimized />
          ) : null}
          <p className="text-center text-xs text-slate-500">Rotate the QR if you think the current identity has been exposed.</p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Generate your QR identity when you are ready to check in.
        </div>
      )}
      {state.message ? <p className={state.ok ? "mt-4 text-sm text-brand" : "mt-4 text-sm text-red-700"}>{state.message}</p> : null}
    </Card>
  );
}
