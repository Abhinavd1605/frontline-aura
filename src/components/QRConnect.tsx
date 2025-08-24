import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Wifi, Copy, Check, AlertCircle } from 'lucide-react';

interface QRConnectProps {
  className?: string;
}

export function QRConnect({ className }: QRConnectProps) {
  const [mobileUrl, setMobileUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLocalhost, setIsLocalhost] = useState(false);
  const [detectedIP, setDetectedIP] = useState('');

  useEffect(() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    // Check if we're running on localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      setIsLocalhost(true);
      
      // Try to detect the actual network IP
      const detectNetworkIP = async () => {
        try {
          // Method 1: Ask server for its detected IP
          const response = await fetch('/api/server-info');
          if (response.ok) {
            const data = await response.json();
            if (data.preferredIP) {
              return data.preferredIP;
            }
          }
        } catch (error) {
          console.log('Server IP detection failed, trying WebRTC...');
        }
        
        try {
          // Method 2: Try to get IP via WebRTC
          const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
          });
          
          pc.createDataChannel('');
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          
          return new Promise((resolve) => {
            pc.onicecandidate = (ice) => {
              if (ice && ice.candidate && ice.candidate.candidate) {
                const myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(ice.candidate.candidate);
                if (myIP && myIP[1] && !myIP[1].startsWith('127.')) {
                  resolve(myIP[1]);
                  pc.close();
                }
              }
            };
            
            // Fallback after 3 seconds
            setTimeout(() => {
              resolve('192.168.1.100'); // Common IP placeholder
              pc.close();
            }, 3000);
          });
        } catch (error) {
          return '192.168.1.100'; // Fallback IP
        }
      };
      
      detectNetworkIP().then((ip) => {
        setDetectedIP(ip as string);
        
        // For development, use HTTP by default since HTTPS requires certificates
        // In production, this would be HTTPS
        const devProtocol = 'http:';
        const networkUrl = `${devProtocol}//${ip}:${port}/mobile-voice`;
        setMobileUrl(networkUrl);
        
        // Generate QR code with detected IP and proper protocol
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(networkUrl)}`;
        setQrCodeUrl(qrUrl);
      });
      
    } else {
      // Production URL
      setIsLocalhost(false);
      const url = `${protocol}//${hostname}${port ? ':' + port : ''}/mobile-voice`;
      setMobileUrl(url);
      
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
      setQrCodeUrl(qrUrl);
    }
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  return (
    <Card className={`p-6 ${className}`}>
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Smartphone className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Connect Mobile Device</h3>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Scan QR code or visit the URL on your mobile device to start voice chat
        </p>
        
        {isLocalhost && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Development Mode</span>
            </div>
            <div className="text-xs text-amber-700 space-y-1">
              <p>Your mobile device needs to be on the same WiFi network.</p>
              {detectedIP && <p>Detected IP: {detectedIP}</p>}
              <p>⚠️ Uses HTTP in development (voice requires manual permission)</p>
            </div>
          </div>
        )}

        {/* QR Code */}
        <div className="mb-4">
          <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
            {qrCodeUrl ? (
              <img 
                src={qrCodeUrl} 
                alt="QR Code for mobile voice interface"
                className="w-48 h-48 mx-auto"
                onError={(e) => {
                  // Fallback if QR service is unavailable
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Wifi className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Loading QR Code...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* URL */}
        <div className="mb-4">
          <Badge variant="secondary" className="mb-2">Mobile URL</Badge>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md text-sm">
            <code className="flex-1 text-left">{mobileUrl}</code>
            <Button
              onClick={copyToClipboard}
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-left text-xs text-gray-600 space-y-1">
          <p><strong>Method 1:</strong> Scan the QR code with your phone camera</p>
          <p><strong>Method 2:</strong> Copy the URL and open it in your mobile browser</p>
          <p><strong>Method 3:</strong> Connect via Bluetooth (if supported)</p>
        </div>

        {/* Features */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-xs text-gray-500 mb-2">Mobile features:</p>
          <div className="flex flex-wrap gap-1 justify-center">
            <Badge variant="outline" className="text-xs">Push-to-Talk</Badge>
            <Badge variant="outline" className="text-xs">Voice Response</Badge>
            <Badge variant="outline" className="text-xs">Machine Selection</Badge>
            <Badge variant="outline" className="text-xs">Offline Speech</Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
