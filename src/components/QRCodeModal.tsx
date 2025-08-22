import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import * as qrcode from "qrcode-terminal";
import type { VideoItem } from "../types";

interface QRCodeModalProps {
  video: VideoItem | null;
  isVisible: boolean;
  onClose: () => void;
}

export function QRCodeModal({ video, isVisible, onClose }: QRCodeModalProps) {
  const [qrCodeData, setQrCodeData] = useState<string>("");

  useEffect(() => {
    if (video?.link && isVisible) {
      try {
        qrcode.generate(video.link, { small: false }, (qrString: string) => {
          setQrCodeData(qrString);
        });
      } catch (err) {
        console.error("QR code generation failed:", err);
      }
    }
  }, [video?.link, isVisible]);

  useInput((input, key) => {
    if (
      isVisible &&
      (key.escape || input === "q" || input === " " || key.return)
    ) {
      onClose();
    }
  });

  if (!isVisible || !video) {
    return null;
  }

  return (
    <Box
      position="absolute"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      width="100%"
      height="100%"
    >
      {qrCodeData ? (
        <Text>{qrCodeData}</Text>
      ) : (
        <Text color="yellow">Generating QR code...</Text>
      )}
    </Box>
  );
}
