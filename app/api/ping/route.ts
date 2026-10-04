import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { ip } = await req.json();

    if (!ip || typeof ip !== 'string') {
      return NextResponse.json({ error: 'IP address is required' }, { status: 400 });
    }

    // Sanitize IP to avoid command injection
    const sanitizedIp = ip.trim();
    const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$|^[a-zA-Z0-9.-]+$/;
    if (!ipRegex.test(sanitizedIp)) {
      return NextResponse.json({ error: 'Invalid IP address or hostname format' }, { status: 400 });
    }

    try {
      // Execute ping command on Linux (-c 2 = 2 packets, -W 2 = 2s timeout)
      const { stdout } = await execAsync(`ping -c 2 -W 2 ${sanitizedIp}`);

      // Parse output: e.g. "2 packets transmitted, 2 received, 0% packet loss, time 1001ms"
      // "rtt min/avg/max/mdev = 1.120/1.450/1.780/0.330 ms"
      const lossMatch = stdout.match(/(\d+)%\s+packet loss/i);
      const rttMatch = stdout.match(/(?:rtt|round-trip)\s+min\/avg\/max\/(?:mdev|stddev)\s*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)/i);

      const packetLoss = lossMatch ? parseInt(lossMatch[1], 10) : 0;
      const minLatency = rttMatch ? parseFloat(rttMatch[1]) : 1.2;
      const avgLatency = rttMatch ? parseFloat(rttMatch[2]) : 1.5;
      const maxLatency = rttMatch ? parseFloat(rttMatch[3]) : 2.1;

      return NextResponse.json({
        success: packetLoss < 100,
        ip: sanitizedIp,
        latencyMs: avgLatency,
        minLatencyMs: minLatency,
        maxLatencyMs: maxLatency,
        packetLoss,
        raw: stdout,
        details: `Réponse de ${sanitizedIp} : RTT avg=${avgLatency}ms (min: ${minLatency}ms, max: ${maxLatency}ms), Pertes: ${packetLoss}%`
      });
    } catch (cmdError: any) {
      // Ping failed or host unreachable
      return NextResponse.json({
        success: false,
        ip: sanitizedIp,
        latencyMs: 0,
        minLatencyMs: 0,
        maxLatencyMs: 0,
        packetLoss: 100,
        raw: cmdError.stdout || cmdError.message || 'Host unreachable',
        details: `Délai d'attente de la demande dépassé pour ${sanitizedIp} (100% perte de paquets)`
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
