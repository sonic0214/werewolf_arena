import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface BettingPanelProps {
  onClose: () => void;
  wolvesOdds: number;
  villagersOdds: number;
}

const BettingPanel = ({
  onClose,
  wolvesOdds,
  villagersOdds,
}: BettingPanelProps) => {
  const [amount, setAmount] = useState("");
  const [selected, setSelected] = useState<"wolf" | "villager" | null>(null);

  const handleBet = () => {
    if (!selected || !amount) return;
    
    const teamName = selected === "wolf" ? "狼人" : "平民";
    const odds = selected === "wolf" ? wolvesOdds : villagersOdds;
    
    toast.success("下注成功！", {
      description: `已下注 ${amount} 金币在 ${teamName}胜 (${odds}倍赔率)`,
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-end p-6">
      <Card className="w-96 bg-card border-border shadow-accent-glow animate-slide-up">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">竞猜下注</h3>
            <p className="text-xs text-muted-foreground">选择阵营并下注</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`
                p-4 cursor-pointer transition-all border-2
                ${selected === "wolf"
                  ? "border-destructive bg-destructive/10"
                  : "border-border hover:border-destructive/50"
                }
              `}
              onClick={() => setSelected("wolf")}
            >
              <div className="text-center space-y-2">
                <div className="text-3xl">🐺</div>
                <div className="font-bold text-base">狼人阵营</div>
                <Badge variant="destructive" className="text-sm font-bold px-3 py-1">
                  {Math.round(100 / wolvesOdds)}金币/注
                </Badge>
              </div>
            </Card>

            <Card
              className={`
                p-4 cursor-pointer transition-all border-2
                ${selected === "villager"
                  ? "border-success bg-success/10"
                  : "border-border hover:border-success/50"
                }
              `}
              onClick={() => setSelected("villager")}
            >
              <div className="text-center space-y-2">
                <div className="text-3xl">👨‍🌾</div>
                <div className="font-bold text-base">平民阵营</div>
                <Badge className="text-sm font-bold px-3 py-1 bg-success text-success-foreground">
                  {Math.round(100 / villagersOdds)}金币/注
                </Badge>
              </div>
            </Card>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              下注金额
            </label>
            <Input
              type="number"
              placeholder="输入金额"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div className="p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">当前下注情况</span>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">狼人总注</span>
                <span className="font-mono">12,580</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">平民总注</span>
                <span className="font-mono">18,340</span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleBet}
            disabled={!selected || !amount}
            className="w-full"
            size="lg"
          >
            确认下注
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default BettingPanel;
