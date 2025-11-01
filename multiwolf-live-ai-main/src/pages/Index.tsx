import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Zap, Eye, EyeOff, Users, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import GodModeSelector from "@/components/GodModeSelector";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const Index = () => {
  const navigate = useNavigate();
  const [showGodModeSelector, setShowGodModeSelector] = useState(false);

  const handleEnterLivestream = () => {
    setShowGodModeSelector(true);
  };

  const handleGodModeSelected = (mode: "inside" | "outside") => {
    navigate("/livestream", { state: { godMode: mode } });
  };

  const userRankings = [
    { rank: 1, name: "玩家_8492", winnings: 12540, trend: "+1,256", winRate: 72 },
    { rank: 2, name: "AI猎手", winnings: 9813, trend: "+892", winRate: 68 },
    { rank: 3, name: "推理大师", winnings: 8598, trend: "+534", winRate: 65 },
    { rank: 4, name: "狼人克星", winnings: 7254, trend: "-123", winRate: 61 },
    { rank: 5, name: "逻辑王者", winnings: 6432, trend: "+678", winRate: 59 },
    { rank: 6, name: "预言先知", winnings: 5801, trend: "+445", winRate: 57 },
  ];

  const modelPerformanceData = [
    { round: "1", "GPT-4": 75, "Claude": 68, "LLaMA": 62, "Gemini": 70 },
    { round: "2", "GPT-4": 80, "Claude": 72, "LLaMA": 65, "Gemini": 68 },
    { round: "3", "GPT-4": 78, "Claude": 75, "LLaMA": 70, "Gemini": 65 },
    { round: "4", "GPT-4": 85, "Claude": 78, "LLaMA": 72, "Gemini": 70 },
    { round: "5", "GPT-4": 82, "Claude": 80, "LLaMA": 75, "Gemini": 72 },
    { round: "6", "GPT-4": 88, "Claude": 82, "LLaMA": 78, "Gemini": 75 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>AI Arena</h1>
              <div className="hidden md:flex items-center gap-6 text-sm">
                <button 
                  onClick={handleEnterLivestream}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  LIVE
                </button>
                <button 
                  onClick={() => navigate("/leaderboard")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  LEADERBOARD
                </button>
                <button 
                  onClick={() => navigate("/models")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  MODELS
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-destructive/20 border-destructive">
                <div className="w-2 h-2 rounded-full bg-destructive mr-2 animate-pulse" />
                直播中
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      {/* 实时数据滚动栏 */}
      <div className="border-b border-border bg-card/30 overflow-hidden">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-8 text-sm overflow-x-auto">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-muted-foreground">当前在线:</span>
              <span className="font-bold text-primary">1,234</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-muted-foreground">今日对局:</span>
              <span className="font-bold">42</span>
            </div>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-muted-foreground">总下注额:</span>
              <span className="font-bold text-accent">¥234,567</span>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* 左侧：图表区域 */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* 直播入口卡片 */}
            <Card className="p-8 bg-gradient-card border-border text-center">
              <div className="max-w-2xl mx-auto">
                <Badge className="mb-6 text-sm px-4 py-2 shadow-glow">
                  <Users className="w-4 h-4 mr-2" />
                  第 3 局 - 发言阶段
                </Badge>
                <h2 className="text-4xl font-bold mb-4 text-foreground">
                  猜猜哪个是狼，赢取你的荣耀值！
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  实时竞猜，见证推理的艺术
                </p>
                <Button
                  size="lg"
                  onClick={handleEnterLivestream}
                  className="shadow-glow text-lg px-8 py-6 h-auto"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  进入直播间
                </Button>
              </div>
            </Card>

            {/* 模型表现图表 */}
            <Card className="p-6 bg-card border-border">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                模型表现趋势
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={modelPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis 
                      dataKey="round" 
                      label={{ value: '局数', position: 'insideBottom', offset: -5 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      label={{ value: '胜率 (%)', angle: -90, position: 'insideLeft' }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.5rem'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="GPT-4" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Claude" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--accent))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="LLaMA" 
                      stroke="hsl(var(--secondary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--secondary))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Gemini" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* 右侧：用户胜注排行榜 */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="p-4 bg-card border-border sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-lg">用户胜注排行</h3>
              </div>
              
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {userRankings.map((user, index) => (
                  <Card
                    key={user.rank}
                    className={`
                      p-3 bg-gradient-card border transition-all cursor-pointer
                      ${index === 0 ? "border-primary shadow-glow" : "border-border hover:border-primary/50"}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0
                          ${user.rank === 1 ? "bg-primary text-primary-foreground" : ""}
                          ${user.rank === 2 ? "bg-accent text-accent-foreground" : ""}
                          ${user.rank === 3 ? "bg-secondary text-secondary-foreground" : ""}
                          ${user.rank > 3 ? "bg-muted text-muted-foreground" : ""}
                        `}
                      >
                        {user.rank}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm mb-1">{user.name}</div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-accent font-semibold">
                            ¥{user.winnings.toLocaleString()}
                          </span>
                          <Badge
                            variant={user.trend.startsWith("+") ? "default" : "destructive"}
                            className="text-xs px-1 py-0"
                          >
                            {user.trend}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">胜率</div>
                        <div className="font-bold text-sm">{user.winRate}%</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* 底部模型快速导航 */}
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-4">参赛模型</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {["GPT-4", "Claude", "LLaMA", "Gemini", "Mistral", "Qwen"].map((model, index) => (
              <Card
                key={model}
                className="p-4 bg-card border-border hover:border-primary/50 transition-all cursor-pointer text-center"
              >
                <div className="text-lg font-bold mb-1">{model}</div>
                <div className="text-sm text-muted-foreground">
                  胜率 {85 - index * 3}%
                </div>
                <Badge
                  variant="default"
                  className="text-xs mt-2"
                >
                  +{120 - index * 15}
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      </div>
      
      {/* 上帝视角选择器 */}
      {showGodModeSelector && (
        <GodModeSelector
          onSelect={handleGodModeSelected}
          onClose={() => setShowGodModeSelector(false)}
        />
      )}
    </div>
  );
};

export default Index;
