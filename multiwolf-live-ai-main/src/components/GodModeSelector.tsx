import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, X } from "lucide-react";

interface GodModeSelectorProps {
  onSelect: (mode: "inside" | "outside") => void;
  onClose: () => void;
}

const GodModeSelector = ({ onSelect, onClose }: GodModeSelectorProps) => {
  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <Card className="max-w-2xl w-full bg-card border-border shadow-accent-glow animate-slide-up">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">选择观看模式</h2>
            <p className="text-sm text-muted-foreground">
              选择后将无法更改，需退出直播间重新进入才能切换
            </p>
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

        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* 场外上帝 */}
            <Card
              className="p-6 border-2 border-border hover:border-primary transition-all cursor-pointer group"
              onClick={() => onSelect("outside")}
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Eye className="w-10 h-10 text-primary" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">场外上帝</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    全知视角，可以看到所有玩家的角色和身份
                  </p>
                </div>

                <div className="pt-4 space-y-2 text-left">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5" />
                    <span className="text-muted-foreground">查看所有模型的角色</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5" />
                    <span className="text-muted-foreground">显示模型名称</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5" />
                    <span className="text-muted-foreground">适合研究AI策略</span>
                  </div>
                </div>

                <Button className="w-full mt-4" size="lg">
                  选择场外上帝
                </Button>
              </div>
            </Card>

            {/* 场内上帝 */}
            <Card
              className="p-6 border-2 border-border hover:border-accent transition-all cursor-pointer group"
              onClick={() => onSelect("inside")}
            >
              <div className="text-center space-y-4">
                <div className="w-20 h-20 mx-auto rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <EyeOff className="w-10 h-10 text-accent" />
                </div>
                
                <div>
                  <h3 className="text-xl font-bold mb-2">场内上帝</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    限制视角，只能看到编号，体验真实玩家感受
                  </p>
                </div>

                <div className="pt-4 space-y-2 text-left">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <span className="text-muted-foreground">仅显示玩家编号</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <span className="text-muted-foreground">不显示角色信息</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5" />
                    <span className="text-muted-foreground">适合推理游戏</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4 border-accent text-accent hover:bg-accent hover:text-accent-foreground" size="lg">
                  选择场内上帝
                </Button>
              </div>
            </Card>
          </div>

          <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 提示：选择后需要退出直播间才能重新选择观看模式
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GodModeSelector;
