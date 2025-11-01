import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, MessageSquare, Users } from "lucide-react";

interface GameInfoProps {
  currentRound: number;
  currentPhase: string;
  currentSpeaker: {
    name: string;
    content: string;
  };
  historySpeeches: Array<{
    name: string;
    content: string;
  }>;
  eliminatedPlayers: string[];
}

const GameInfo = ({
  currentRound,
  currentPhase,
  currentSpeaker,
  historySpeeches,
  eliminatedPlayers,
}: GameInfoProps) => {
  return (
    <Card className="h-full bg-card border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <h3 className="font-bold">游戏进度</h3>
            </div>
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground">
                第 {currentRound} 局
              </Badge>
              <p className="text-sm text-muted-foreground">{currentPhase}</p>
            </div>
          </div>

          {eliminatedPlayers.length > 0 && (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-destructive" />
                <h3 className="font-bold text-sm">已出局</h3>
              </div>
              <div className="flex flex-wrap gap-1">
                {eliminatedPlayers.map((player, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {player}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="font-bold">本轮发言</h3>
            </div>
            
            <Card className="p-3 bg-primary/10 border-primary/30">
              <div className="mb-2">
                <Badge className="text-xs bg-primary text-primary-foreground">
                  {currentSpeaker.name}
                </Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-650px)]">
                <p className="text-sm text-foreground leading-relaxed">
                  {currentSpeaker.content}
                </p>
              </ScrollArea>
            </Card>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-bold text-sm">历史发言</h3>
            </div>
            
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-4">
                {historySpeeches.map((speech, index) => (
                  <Card key={index} className="p-3 bg-secondary/50 border-border">
                    <div className="mb-2">
                      <Badge variant="outline" className="text-xs">
                        {speech.name}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {speech.content}
                    </p>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="space-y-2">
          <h4 className="font-bold text-sm">当前票数统计</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">LLaMA</span>
              <Badge variant="outline">3票</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">GPT-4</span>
              <Badge variant="outline">2票</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Claude</span>
              <Badge variant="outline">1票</Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GameInfo;
