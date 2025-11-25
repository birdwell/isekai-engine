import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Heart } from 'lucide-react';
import { StatCard } from './StatCard';
import { LocationCard } from './LocationCard';
import { CurrencyDisplay } from './CurrencyDisplay';
import { InventoryGrid } from './InventoryGrid';
import { SkillsDisplay } from './SkillsDisplay';
import { QuestDisplay } from './QuestDisplay';
import { QuestLogModal } from './QuestLogModal';
import { StatusPanel } from './index';
import { Quest, QuestStatus, QuestType, GameStatus } from '@/types';

describe('StatCard', () => {
  it('renders label and value', () => {
    render(<StatCard icon={Heart} iconColor="text-red-500" label="Health" value="100/100" />);
    
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument();
  });

  it('applies custom valueColor', () => {
    render(<StatCard icon={Heart} iconColor="text-red-500" label="HP" value="50" valueColor="text-green-500" />);
    
    const valueElement = screen.getByText('50');
    expect(valueElement).toHaveClass('text-green-500');
  });
});

describe('LocationCard', () => {
  it('renders location text', () => {
    render(<LocationCard location="Dark Forest" />);
    
    expect(screen.getByText('Dark Forest')).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });
});

describe('CurrencyDisplay', () => {
  it('renders all three currency values', () => {
    render(<CurrencyDisplay gold={10} silver={25} copper={99} />);
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('99')).toBeInTheDocument();
    expect(screen.getByText('Gold')).toBeInTheDocument();
    expect(screen.getByText('Silver')).toBeInTheDocument();
    expect(screen.getByText('Copper')).toBeInTheDocument();
  });
});

describe('InventoryGrid', () => {
  it('shows empty state when no items', () => {
    render(<InventoryGrid items={[]} onUseItem={vi.fn()} />);
    
    expect(screen.getByText('Bag is empty')).toBeInTheDocument();
  });

  it('renders items', () => {
    render(<InventoryGrid items={['Sword', 'Shield']} onUseItem={vi.fn()} />);
    
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('Shield')).toBeInTheDocument();
  });

  it('calls onUseItem when item is clicked', () => {
    const onUseItem = vi.fn();
    render(<InventoryGrid items={['Potion']} onUseItem={onUseItem} />);
    
    fireEvent.click(screen.getByText('Potion'));
    
    expect(onUseItem).toHaveBeenCalledWith('Potion');
  });
});

describe('SkillsDisplay', () => {
  it('shows empty state when no skills', () => {
    render(<SkillsDisplay skills={[]} />);
    
    expect(screen.getByText('No skills acquired')).toBeInTheDocument();
  });

  it('renders skills', () => {
    render(<SkillsDisplay skills={['Fireball', 'Healing']} />);
    
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.getByText('Healing')).toBeInTheDocument();
  });
});

describe('QuestDisplay', () => {
  const mockQuest: Quest = {
    id: 'quest-1',
    title: 'Find the Sword',
    description: 'Retrieve the legendary sword',
    type: QuestType.Main,
    status: QuestStatus.Active,
    objectives: [
      { id: 'obj-1', description: 'Go to the cave', isCompleted: false, isOptional: false },
      { id: 'obj-2', description: 'Defeat the dragon', isCompleted: false, isOptional: true }
    ],
    startedAt: Date.now()
  };

  it('renders quest info', () => {
    render(
      <QuestDisplay 
        activeQuest={mockQuest} 
        activeQuestText="" 
        onViewLog={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText('Find the Sword')).toBeInTheDocument();
    expect(screen.getByText('MAIN QUEST')).toBeInTheDocument();
    expect(screen.getByText('50% complete')).toBeInTheDocument();
  });

  it('shows objectives', () => {
    render(
      <QuestDisplay 
        activeQuest={mockQuest} 
        activeQuestText="" 
        onViewLog={vi.fn()} 
        getProgress={() => 0} 
      />
    );
    
    expect(screen.getByText('Go to the cave')).toBeInTheDocument();
    expect(screen.getByText('Defeat the dragon')).toBeInTheDocument();
    expect(screen.getByText('(optional)')).toBeInTheDocument();
  });

  it('calls onViewLog when VIEW LOG is clicked', () => {
    const onViewLog = vi.fn();
    render(
      <QuestDisplay 
        activeQuest={mockQuest} 
        activeQuestText="" 
        onViewLog={onViewLog} 
        getProgress={() => 0} 
      />
    );
    
    fireEvent.click(screen.getByText('VIEW LOG'));
    
    expect(onViewLog).toHaveBeenCalled();
  });

  it('shows fallback text when no active quest', () => {
    render(
      <QuestDisplay 
        activeQuest={null} 
        activeQuestText="Explore the world" 
        onViewLog={vi.fn()} 
        getProgress={() => 0} 
      />
    );
    
    expect(screen.getByText('Explore the world')).toBeInTheDocument();
  });
});

describe('QuestLogModal', () => {
  const baseTime = new Date('2024-01-15T10:30:00').getTime();
  const completedTime = new Date('2024-01-15T14:45:00').getTime();

  const mockQuests: Quest[] = [
    {
      id: 'quest-1',
      title: 'Main Quest',
      description: 'The main storyline',
      type: QuestType.Main,
      status: QuestStatus.Active,
      objectives: [{ id: 'obj-1', description: 'Complete task', isCompleted: false, isOptional: false }],
      startedAt: baseTime
    },
    {
      id: 'quest-2',
      title: 'Side Quest',
      description: 'A side adventure',
      type: QuestType.Side,
      status: QuestStatus.Completed,
      objectives: [{ id: 'obj-2', description: 'Finish side task', isCompleted: true, isOptional: false }],
      startedAt: baseTime,
      completedAt: completedTime
    }
  ];

  it('returns null when closed', () => {
    const { container } = render(
      <QuestLogModal 
        isOpen={false} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders when open', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText('Quest Journal')).toBeInTheDocument();
    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.getByText('Side Quest')).toBeInTheDocument();
  });

  it('filters work', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('completed'));
    
    expect(screen.queryByText('Main Quest')).not.toBeInTheDocument();
    expect(screen.getByText('Side Quest')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={onClose} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('filters by active quests', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('active'));
    
    expect(screen.getByText('Main Quest')).toBeInTheDocument();
    expect(screen.queryByText('Side Quest')).not.toBeInTheDocument();
  });

  it('filters by failed quests', () => {
    const questsWithFailed: Quest[] = [
      ...mockQuests,
      {
        id: 'quest-3',
        title: 'Failed Quest',
        description: 'This quest failed',
        type: QuestType.Side,
        status: QuestStatus.Failed,
        objectives: [],
        startedAt: baseTime
      }
    ];

    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={questsWithFailed} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 0} 
      />
    );
    
    fireEvent.click(screen.getByText('failed'));
    
    expect(screen.getByText('Failed Quest')).toBeInTheDocument();
    expect(screen.queryByText('Main Quest')).not.toBeInTheDocument();
    expect(screen.queryByText('Side Quest')).not.toBeInTheDocument();
  });

  it('shows empty state when no quests match filter', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('failed'));
    
    expect(screen.getByText('No quests match the current filter.')).toBeInTheDocument();
  });

  it('expands quest card when clicked', () => {
    const questWithRewards: Quest[] = [{
      id: 'quest-1',
      title: 'Main Quest',
      description: 'The main storyline',
      type: QuestType.Main,
      status: QuestStatus.Active,
      objectives: [
        { id: 'obj-1', description: 'Complete task', isCompleted: false, isOptional: false },
        { id: 'obj-2', description: 'Optional task', isCompleted: true, isOptional: true }
      ],
      rewards: ['100 Gold', 'Magic Sword'],
      startedAt: baseTime
    }];

    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={questWithRewards} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.queryByText('Objectives')).not.toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Main Quest'));
    
    expect(screen.getByText('Objectives')).toBeInTheDocument();
    expect(screen.getByText('Complete task')).toBeInTheDocument();
    expect(screen.getByText('Optional task')).toBeInTheDocument();
    expect(screen.getByText('(optional)')).toBeInTheDocument();
    expect(screen.getByText('Rewards')).toBeInTheDocument();
    expect(screen.getByText('100 Gold')).toBeInTheDocument();
    expect(screen.getByText('Magic Sword')).toBeInTheDocument();
  });

  it('collapses quest card when clicked again', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Main Quest'));
    expect(screen.getByText('Objectives')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Main Quest'));
    expect(screen.queryByText('Objectives')).not.toBeInTheDocument();
  });

  it('shows SET ACTIVE button for non-active active quests', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Main Quest'));
    
    expect(screen.getByText('SET ACTIVE')).toBeInTheDocument();
  });

  it('does not show SET ACTIVE for currently active quest', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId="quest-1" 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Main Quest'));
    
    expect(screen.queryByText('SET ACTIVE')).not.toBeInTheDocument();
  });

  it('does not show SET ACTIVE for completed quests', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Side Quest'));
    
    expect(screen.queryByText('SET ACTIVE')).not.toBeInTheDocument();
  });

  it('calls onSetActiveQuest when SET ACTIVE is clicked', () => {
    const onSetActiveQuest = vi.fn();
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={onSetActiveQuest} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Main Quest'));
    fireEvent.click(screen.getByText('SET ACTIVE'));
    
    expect(onSetActiveQuest).toHaveBeenCalledWith('quest-1');
  });

  it('shows progress bar for active quests', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 75} 
      />
    );
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('shows Active badge for currently active quest', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId="quest-1" 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders Main Quests section', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText('Main Quests')).toBeInTheDocument();
  });

  it('renders Side Quests section', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText('Side Quests')).toBeInTheDocument();
  });

  it('shows completedAt when quest is completed', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Side Quest'));
    
    expect(screen.getByText(/Ended:/)).toBeInTheDocument();
  });

  it('formatTime displays correct date format', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    fireEvent.click(screen.getByText('Main Quest'));
    
    expect(screen.getByText(/Started:/)).toBeInTheDocument();
  });

  it('shows quest counts in header', () => {
    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={mockQuests} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 50} 
      />
    );
    
    expect(screen.getByText(/1 active/)).toBeInTheDocument();
    expect(screen.getByText(/1 completed/)).toBeInTheDocument();
  });

  it('applies hidden status styling', () => {
    const questsWithHidden: Quest[] = [{
      id: 'quest-hidden',
      title: 'Hidden Quest',
      description: 'A hidden quest',
      type: QuestType.Main,
      status: QuestStatus.Hidden,
      objectives: [],
      startedAt: baseTime
    }];

    render(
      <QuestLogModal 
        isOpen={true} 
        onClose={vi.fn()} 
        quests={questsWithHidden} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getProgress={() => 0} 
      />
    );
    
    expect(screen.getByText('Hidden Quest')).toBeInTheDocument();
  });
});

describe('StatusPanel', () => {
  const mockStatus: GameStatus = {
    hp: '100/100',
    location: 'Town Square',
    inventory: ['Sword', 'Potion'],
    skills: ['Slash', 'Block'],
    activeQuest: 'Find the treasure',
    currency: { gold: 5, silver: 10, copper: 50 }
  };

  const mockQuest: Quest = {
    id: 'quest-1',
    title: 'Find the Treasure',
    description: 'Locate the hidden treasure',
    type: QuestType.Main,
    status: QuestStatus.Active,
    objectives: [],
    startedAt: Date.now()
  };

  it('returns null when no status', () => {
    const { container } = render(
      <StatusPanel 
        status={null} 
        onUseItem={vi.fn()} 
        activeQuest={null} 
        quests={[]} 
        activeQuestId={null} 
        onSetActiveQuest={vi.fn()} 
        getQuestProgress={() => 0} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('renders all sections when status provided', () => {
    render(
      <StatusPanel 
        status={mockStatus} 
        onUseItem={vi.fn()} 
        activeQuest={mockQuest} 
        quests={[mockQuest]} 
        activeQuestId="quest-1" 
        onSetActiveQuest={vi.fn()} 
        getQuestProgress={() => 25} 
      />
    );
    
    expect(screen.getByText('STATUS')).toBeInTheDocument();
    expect(screen.getByText('100/100')).toBeInTheDocument();
    expect(screen.getByText('Town Square')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Sword')).toBeInTheDocument();
    expect(screen.getByText('Slash')).toBeInTheDocument();
    expect(screen.getByText('Find the Treasure')).toBeInTheDocument();
  });

  it('opens quest log modal when VIEW LOG is clicked', () => {
    render(
      <StatusPanel 
        status={mockStatus} 
        onUseItem={vi.fn()} 
        activeQuest={mockQuest} 
        quests={[mockQuest]} 
        activeQuestId="quest-1" 
        onSetActiveQuest={vi.fn()} 
        getQuestProgress={() => 25} 
      />
    );
    
    fireEvent.click(screen.getByText('VIEW LOG'));
    
    expect(screen.getByText('Quest Journal')).toBeInTheDocument();
  });
});
