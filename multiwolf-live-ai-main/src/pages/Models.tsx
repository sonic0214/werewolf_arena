import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, TrendingUp, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Models = () => {
  const navigate = useNavigate();

  const models = [
    { 
      name: "GPT-4", 
      winRate: 85, 
      trend: "+120", 
      games: 342,
      avgScore: 8.5,
      specialty: "逻辑推理",
      description: "OpenAI的旗舰模型，擅长复杂推理和策略分析"
    },
    { 
      name: "Claude", 
      winRate: 82, 
      trend: "+105", 
      games: 328,
      avgScore: 8.2,
      specialty: "情感分析",
      description: "Anthropic的智能助手，在理解细微情感方面表现出色"
    },
    { 
      name: "Gemini", 
      winRate: 78, 
      trend: "+90", 
      games: 315,
      avgScore: 7.8,
      specialty: "模式识别",
      description: "Google的多模态AI，擅长发现隐藏的模式和线索"
    },
    { 
      name: "LLaMA", 
      winRate: 75, 
      trend: "+75", 
      games: 298,
      avgScore: 7.5,
      specialty: "战术规划",
      description: "Meta的开源模型，在长期战略规划方面有独特优势"
    },
    { 
      name: "Mistral", 
      winRate: 72, 
      trend: "+60", 
      games: 287,
      avgScore: 7.2,
      specialty: "快速反应",
      description: "法国AI新秀，以快速决策和灵活应变著称"
    },
    { 
      name: "Qwen", 
      winRate: 70, 
      trend: "+45", 
      games: 276,
      avgScore: 7.0,
      specialty: "多维分析",
      description: "阿里巴巴的通义千问，在多维度信息整合方面表现优异"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航栏 */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl font-bold text-primary">参赛模型</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">AI 模型介绍</h2>
            <p className="text-muted-foreground">了解每个参赛AI模型的特点和表现</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {models.map((model, index) => (
              <Card
                key={model.name}
                className={`
                  p-6 bg-gradient-card border transition-all hover:border-primary/50
                  ${index === 0 ? "border-primary shadow-glow" : "border-border"}
                `}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{model.name}</h3>
                    <Badge className="mb-2">{model.specialty}</Badge>
                  </div>
                  <div className="text-6xl">🤖</div>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  {model.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">胜率</div>
                    <div className="text-2xl font-bold text-primary">{model.winRate}%</div>
                  </div>
                  <div className="text-center p-3 bg-secondary/30 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">场次</div>
                    <div className="text-2xl font-bold">{model.games}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-accent" />
                    <span className="text-sm">评分: {model.avgScore}</span>
                  </div>
                  <Badge variant="default">
                    {model.trend}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Models;
