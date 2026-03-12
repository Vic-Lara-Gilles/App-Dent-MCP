"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

interface PaymentDonutProps {
  paid: number;
  balance: number;
  total: number;
}

const COLOR_PAID = "#22c55e";
const COLOR_BALANCE_LIGHT = "#d4d4d8"; // zinc-300 gris
const COLOR_BALANCE_DARK = "#eab308";  // yellow-500 amarillo

export function PaymentDonut({ paid, balance, total }: PaymentDonutProps) {
  const { theme } = useTheme();
  const COLOR_BALANCE = theme === "dark" ? COLOR_BALANCE_DARK : COLOR_BALANCE_LIGHT;

  const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

  const chartData =
    paid === 0
      ? [{ name: "Saldo", value: 1 }]
      : [
        { name: "Pagado", value: paid },
        { name: "Saldo", value: balance > 0 ? balance : 0 },
      ];

  const chartColors =
    paid === 0 ? [COLOR_BALANCE] : [COLOR_PAID, COLOR_BALANCE];

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 80, height: 80 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={26}
            outerRadius={38}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            strokeWidth={0}
            isAnimationActive={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={chartColors[i % chartColors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <span
        className="absolute text-[13px] font-bold pointer-events-none select-none text-foreground"
        style={{ color: pct === 100 ? COLOR_PAID : undefined }}
      >
        {pct}%
      </span>
    </div>
  );
}
