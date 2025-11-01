import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X } from "lucide-react";

interface Message {
  id: number;
  user: string;
  content: string;
  bet: "wolf" | "villager" | "none";
  timestamp: Date;
}

interface ChatPanelProps {
  onClose?: () => void;
}

const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, user: "观众A", content: "GPT-4这波很稳", bet: "villager", timestamp: new Date() },
    { id: 2, user: "观众B", content: "我感觉Claude有问题", bet: "wolf", timestamp: new Date() },
    { id: 3, user: "观众C", content: "还在观望中", bet: "none", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage: Message = {
      id: messages.length + 1,
      user: "我",
      content: input,
      bet: "none",
      timestamp: new Date(),
    };
    
    setMessages([...messages, newMessage]);
    setInput("");
  };

  const getBetBadge = (bet: Message["bet"]) => {
    if (bet === "wolf") {
      return <Badge variant="destructive" className="text-xs">狼人</Badge>;
    }
    if (bet === "villager") {
      return <Badge className="text-xs bg-success">平民</Badge>;
    }
    return <Badge variant="outline" className="text-xs">观望</Badge>;
  };

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">观众互动</h3>
          <p className="text-xs text-muted-foreground">当前在线：1,234人</p>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-slide-up">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {msg.user}
                    </span>
                    {getBetBadge(msg.bet)}
                  </div>
                  <p className="text-sm text-muted-foreground break-words">
                    {msg.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="发送消息..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ChatPanel;
