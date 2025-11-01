import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ClawScratchAnimation, ScratchMarksOverlay } from '@/components/ui/ClawScratchAnimation';
import { Player } from '@/types/game';
import { cn, getRoleColor, getRoleIcon, getStatusColor } from '@/lib/utils';

interface PlayerCardProps {
  player: Player;
  selected?: boolean;
  showRole?: boolean;
  isCurrentPlayer?: boolean;
  onSelect?: (playerId: number) => void;
  className?: string;
}

export function PlayerCard({
  player,
  selected = false,
  showRole = false,
  isCurrentPlayer = false,
  onSelect,
  className
}: PlayerCardProps) {
  const [shouldTriggerAnimation, setShouldTriggerAnimation] = useState(false);
  const [hasBeenEliminated, setHasBeenEliminated] = useState(false);
  const previousAliveRef = useRef(player.alive);

  const roleIcon = getRoleIcon(player.role);
  const roleColorClass = getRoleColor(player.role);
  const statusColorClass = getStatusColor(player.alive ? 'alive' : 'dead');

  // Trigger animation when player is eliminated (alive changes from true to false)
  useEffect(() => {
    if (previousAliveRef.current === true && player.alive === false) {
      setShouldTriggerAnimation(true);
      setHasBeenEliminated(true);
    }
    previousAliveRef.current = player.alive;
  }, [player.alive]);

  const handleClick = () => {
    if (onSelect && player.alive) {
      onSelect(player.id);
    }
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        selected && 'ring-2 ring-primary-500 ring-offset-2',
        !player.alive && 'opacity-60',
        isCurrentPlayer && 'border-primary-500 border-2',
        className
      )}
      padding="sm"
    >
      <div className="flex items-center space-x-3" onClick={handleClick}>
        {/* Avatar */}
        <div className="relative">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold relative overflow-hidden',
            player.alive ? 'bg-gray-100' : 'bg-gray-200'
          )}>
            {player.avatar ? (
              <img
                src={player.avatar}
                alt={player.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className={cn(
                player.alive ? 'text-gray-600' : 'text-gray-400'
              )}>
                {player.name.charAt(0).toUpperCase()}
              </span>
            )}

            {/* Claw scratch animation (triggers when eliminated) */}
            <ClawScratchAnimation
              trigger={shouldTriggerAnimation}
              onComplete={() => setShouldTriggerAnimation(false)}
            />

            {/* Persistent scratch marks for eliminated players */}
            {hasBeenEliminated && (
              <ScratchMarksOverlay />
            )}
          </div>

          {/* Role icon (if role is visible) */}
          {showRole && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs border">
              {roleIcon}
            </div>
          )}

          {/* Current player indicator */}
          {isCurrentPlayer && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className={cn(
              'font-medium truncate',
              !player.alive && 'line-through text-gray-500'
            )}>
              {player.name}
              {isCurrentPlayer && ' (You)'}
            </h4>

            {/* Status Badge */}
            <Badge
              variant={player.alive ? 'success' : 'danger'}
              size="sm"
            >
              {player.alive ? 'Alive' : 'Dead'}
            </Badge>
          </div>

          {/* Role Badge (if visible) */}
          {showRole && (
            <div className="mt-1">
              <Badge
                variant="default"
                size="sm"
                className={cn('border', roleColorClass)}
              >
                {roleIcon} {player.role.charAt(0).toUpperCase() + player.role.slice(1)}
              </Badge>
            </div>
          )}

          {/* Player reasoning (if available) */}
          {player.reasoning && (
            <p className="mt-2 text-xs text-gray-600 line-clamp-2">
              {player.reasoning}
            </p>
          )}
        </div>

        {/* Selection indicator */}
        {selected && (
          <div className="text-primary-500">
            <svg
              className="w-6 h-6"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    </Card>
  );
}