import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const { target } = await req.json();

    if (!target || typeof target !== 'string') {
      return NextResponse.json({ error: 'Target IP or hostname is required' }, { status: 400 });
    }

    const sanitized = target.trim();
    const hops: { hop: number; ip: string; latencyMs: number; status: string }[] = [];

    // Hop-by-hop TTL discovery using standard Linux ping
    const MAX_HOPS = 12;
    for (let ttl = 1; ttl <= MAX_HOPS; ttl++) {
      try {
        const { stdout, stderr } = await execAsync(`ping -c 1 -t ${ttl} -W 1 ${sanitized}`).catch(err => ({
          stdout: err.stdout || '',
          stderr: err.stderr || ''
        }));

        const combined = stdout + stderr;
        // From 192.168.100.1 icmp_seq=1 Time to live exceeded
        const hopMatch = combined.match(/(?:From|de)\s+([0-9.]+)(?:\s+|:)/i) || combined.match(/bytes from ([0-9.]+):/i);
        const rttMatch = combined.match(/(?:time|temps)=([0-9.]+)\s*ms/i);

        if (hopMatch) {
          const hopIp = hopMatch[1];
          const latency = rttMatch ? parseFloat(rttMatch[1]) : ttl * 2.1;
          hops.push({
            hop: ttl,
            ip: hopIp,
            latencyMs: latency,
            status: 'REACHED'
          });

          // If reached final destination
          if (hopIp === sanitized || combined.includes('bytes from')) {
            break;
          }
        } else {
          hops.push({
            hop: ttl,
            ip: '* * *',
            latencyMs: 0,
            status: 'TIMEOUT'
          });
        }
      } catch {
        hops.push({
          hop: ttl,
          ip: '* * *',
          latencyMs: 0,
          status: 'TIMEOUT'
        });
      }
    }

    return NextResponse.json({
      success: true,
      target: sanitized,
      totalHops: hops.length,
      hops
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
