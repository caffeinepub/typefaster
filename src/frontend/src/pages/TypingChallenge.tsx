import { useState, useEffect, useRef } from 'react';
import { useSaveChallengeSession } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Clock, Zap, Target, Home, Trophy, SkipForward, CheckCircle, AlertTriangle } from 'lucide-react';

interface TypingChallengeProps {
  onReturn: () => void;
}

// Local type for frontend calculations (using number instead of bigint)
interface LocalChallengeMetrics {
  xpEarned: number;
  accuracyPercent: number;
  wpm: number;
  correctWords: number;
  mistypedWords: number;
  untypedWords: number;
}

// Track per-level typed words
interface LevelTypedWords {
  levelIndex: number;
  typedWords: string[];
}

const LEVELS = [
  {
    level: 1,
    wordCount: 20,
    text: 'The quick brown fox jumps over the lazy dog while children play with kites on sunny afternoons near the riverbank',
  },
  {
    level: 2,
    wordCount: 50,
    text: 'Technology has revolutionized the way we communicate and interact with each other in modern society. From smartphones to social media, digital innovation continues to shape our lives in unprecedented ways around the world. The internet connects people across the globe enabling instant communication and access to vast amounts of information',
  },
  {
    level: 3,
    wordCount: 100,
    text: 'Artificial intelligence and machine learning are transforming industries worldwide from healthcare to finance transportation to entertainment and beyond. These technologies enable computers to learn from data recognize patterns and make decisions with minimal human intervention required. As AI systems become more sophisticated they are being integrated into everyday applications helping us solve complex problems and automate tasks efficiently. The potential benefits are enormous but so are the ethical challenges we must address carefully. Privacy concerns algorithmic bias and the impact on employment are just a few of the critical issues that society must navigate as we embrace this technological revolution',
  },
  {
    level: 4,
    wordCount: 200,
    text: 'Climate change represents one of the most pressing challenges facing humanity in the twenty-first century today. Rising global temperatures, melting ice caps, and increasingly severe weather events are clear indicators that our planet is undergoing significant environmental transformation right now. Scientists worldwide have reached a consensus that human activities, particularly the burning of fossil fuels and widespread deforestation, are the primary drivers of these alarming changes we currently observe. The consequences are far-reaching, affecting delicate ecosystems, global agriculture, essential water resources, and human health across all continents. Coastal communities face the imminent threat of rising sea levels while inland regions experience more frequent droughts and devastating wildfires annually. To effectively address this crisis, governments, businesses, and ordinary individuals must work collaboratively together to substantially reduce greenhouse gas emissions, transition rapidly to renewable energy sources, and implement sustainable practices everywhere immediately. Innovation in clean technology, fundamental changes in consumer behavior, and strengthened international cooperation are all absolutely essential components of the comprehensive solution we urgently need right now. The bold critical decisions we make today will ultimately determine the overall quality of life for many coming future generations and the long-term health of our precious planet for centuries to come ahead',
  },
  {
    level: 5,
    wordCount: 500,
    text: 'The history of human civilization stands as a profound testament to our species\' remarkable ability to adapt, innovate, and overcome challenges throughout the ages. From the earliest hunter-gatherer societies navigating the harsh realities of the wild to the sprawling, complex urban centers of the modern era, humans have continuously evolved their social structures, technologies, and cultural practices over millennia. This endless journey is marked by a relentless drive for improvement, pushing boundaries and redefining precisely what is truly possible for our entire collective future.The agricultural revolution, which began approximately ten thousand years ago, marked a truly pivotal turning point in human history. By shifting from foraging to farming, our ancestors domesticated key plants and animals, a strategic move that allowed them to establish permanent settlements. This stability led to the birth of cities, sophisticated writing systems, and organized governments across various regions. This fundamental transformation laid the foundation for complex economies and all subsequent human achievements that we celebrate and study with such admiration today.The industrial revolution of the eighteenth and nineteenth centuries brought about another dramatic shift that redefined the human experience. As mechanization, steam power, and mass production were introduced, they fundamentally altered the way people lived, worked, and interacted with their local environment. Factories quickly replaced farms as the primary source of employment, and urbanization accelerated at an unprecedented pace, creating dense hubs of vibrant industrial activity. This era birthed new social classes and transformed economies globally, setting the stage for modern global capitalism.The twentieth century witnessed even more rapid and transformative change with massive advances in medicine, transportation, and communication reshaping modern society. The invention of the automobile, airplane, telephone, and television connected people across vast distances, effectively shrinking the entire globe. The invention of vaccines and antibiotics further extended human life expectancy. These innovations broke down physical barriers and transformed daily life completely, allowing for a level of global interaction that was previously unimaginable, setting the stage for a more interconnected global community to thrive.The digital revolution of the late twentieth and early twenty-first centuries has ushered in the information age, where knowledge and data have become the most valuable commodities worldwide. The internet, personal computers, and mobile devices have created a truly globally interconnected world where information flows freely and instantaneously across the globe. Social media platforms have revolutionized how we communicate, share ideas, and form diverse communities online effectively. Meanwhile, e-commerce has revolutionized retail shopping, while streaming services have transformed entertainment consumption habits for everyone everywhere.Looking ahead, emerging technologies such as artificial intelligence, quantum computing, biotechnology, and renewable energy promise rapid, dramatic changes soon. These innovations have the potential to solve some of humanity\'s greatest challenges, from disease and poverty to climate change and resource scarcity worldwide. However, they also raise important ethical questions and potential risks that society must carefully consider together. As we stand on the threshold of this new era, we must approach these developments with wisdom, ensuring technological progress benefits all of humanity equally',
  },
];

const TOTAL_TIME_LIMIT = 600; // 10 minutes in seconds

export default function TypingChallenge({ onReturn }: TypingChallengeProps) {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(TOTAL_TIME_LIMIT);
  const [xp, setXp] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [completionReason, setCompletionReason] = useState<'manual' | 'timeout' | 'finished'>('finished');
  const [showExceededTooltip, setShowExceededTooltip] = useState(false);
  
  // Track time bonus eligibility
  const [hasMistype, setHasMistype] = useState(false);
  const [hasSkippedLevel, setHasSkippedLevel] = useState(false);
  const [hasSkippedWord, setHasSkippedWord] = useState(false);
  
  // Track completion metrics (using local type with number)
  const [completionMetrics, setCompletionMetrics] = useState<LocalChallengeMetrics | null>(null);
  
  // NEW: Track typed words for each level across the entire run
  const [levelTypedWordsHistory, setLevelTypedWordsHistory] = useState<LevelTypedWords[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const saveChallengeSession = useSaveChallengeSession();

  const currentLevelData = LEVELS[currentLevel];
  const words = currentLevelData.text.split(' ');
  
  // Fix: Properly count typed words - return empty array if input is empty or only whitespace
  const typedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ');
  const typedWordsCount = typedWords.length;
  
  // Fix: Progress should be 0 when no words are typed
  const progress = typedWordsCount > 0 ? (typedWordsCount / words.length) * 100 : 0;
  const requiredWords = currentLevelData.wordCount;

  // Check if user exceeded required words
  const hasExceededWords = typedWordsCount > requiredWords;

  useEffect(() => {
    if (!isStarted || isComplete) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isStarted, isComplete]);

  // Show exceeded tooltip when user types beyond required words
  useEffect(() => {
    if (hasExceededWords) {
      setShowExceededTooltip(true);
    } else {
      setShowExceededTooltip(false);
    }
  }, [hasExceededWords]);

  // NEW: Calculate cumulative metrics across all levels
  const calculateCumulativeMetrics = (): LocalChallengeMetrics => {
    let totalCorrectWords = 0;
    let totalMistypedWords = 0;
    let totalXP = 0;
    
    // Process all completed levels from history
    levelTypedWordsHistory.forEach((levelHistory) => {
      const levelData = LEVELS[levelHistory.levelIndex];
      const levelWords = levelData.text.split(' ');
      
      levelHistory.typedWords.forEach((typedWord, index) => {
        if (index < levelWords.length) {
          if (typedWord === levelWords[index]) {
            totalCorrectWords++;
            totalXP += 5;
          } else {
            totalMistypedWords++;
            totalXP -= 10;
          }
        }
      });
    });
    
    // Process current level's input
    const currentTypedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');
    currentTypedWords.forEach((typedWord, index) => {
      if (index < words.length) {
        if (typedWord === words[index]) {
          totalCorrectWords++;
          totalXP += 5;
        } else {
          totalMistypedWords++;
          totalXP -= 10;
        }
      }
    });

    // Calculate total typed words
    const totalTypedWords = totalCorrectWords + totalMistypedWords;
    
    // Count untyped words: total words in all levels minus words user actually typed
    const totalWordsInAllLevels = LEVELS.reduce((sum, level) => sum + level.text.split(' ').length, 0);
    const untypedWords = Math.max(0, totalWordsInAllLevels - totalTypedWords);

    // Calculate accuracy
    const accuracyPercent = totalTypedWords > 0 ? (totalCorrectWords / totalTypedWords) * 100 : 0;

    // Calculate WPM
    const elapsedSeconds = TOTAL_TIME_LIMIT - timeRemaining;
    let wpm = 0;
    
    if (elapsedSeconds >= 60) {
      const elapsedMinutes = Math.floor(elapsedSeconds / 60);
      wpm = Math.floor(totalCorrectWords / elapsedMinutes);
    }

    return {
      xpEarned: totalXP,
      accuracyPercent,
      wpm,
      correctWords: totalCorrectWords,
      mistypedWords: totalMistypedWords,
      untypedWords,
    };
  };

  const calculateXP = () => {
    let totalXP = 0;
    // Fix: Properly filter typed words to exclude empty strings
    const typedWordsArray = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');

    typedWordsArray.forEach((typedWord, index) => {
      if (index < words.length) {
        if (typedWord === words[index]) {
          totalXP += 5;
        } else {
          totalXP -= 10;
          if (!hasMistype) {
            setHasMistype(true);
          }
        }
      }
    });

    return totalXP;
  };

  const handleTimeUp = async () => {
    // Save current level's typed words before calculating
    const currentTypedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');
    const updatedHistory = [...levelTypedWordsHistory, { levelIndex: currentLevel, typedWords: currentTypedWords }];
    setLevelTypedWordsHistory(updatedHistory);
    
    // Calculate cumulative metrics
    const metrics = calculateCumulativeMetrics();
    const levelXP = calculateXP();
    const finalXP = xp + levelXP;
    
    // Timeout means incomplete, so no time bonus
    setHasSkippedWord(true);
    
    setXp(finalXP);
    setCompletionReason('timeout');
    
    // Calculate final metrics with updated XP
    const finalMetrics: LocalChallengeMetrics = {
      ...metrics,
      xpEarned: finalXP,
    };
    setCompletionMetrics(finalMetrics);
    setIsComplete(true);
    toast.error('Time is up! Challenge ended.');
    await handleChallengeComplete(finalMetrics);
  };

  const handleStart = () => {
    setIsStarted(true);
    setXp(0);
    setHasMistype(false);
    setHasSkippedLevel(false);
    setHasSkippedWord(false);
    setCompletionMetrics(null);
    setLevelTypedWordsHistory([]);
    inputRef.current?.focus();
  };

  const handleLevelComplete = () => {
    // Save current level's typed words to history
    const currentTypedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');
    const updatedHistory = [...levelTypedWordsHistory, { levelIndex: currentLevel, typedWords: currentTypedWords }];
    setLevelTypedWordsHistory(updatedHistory);
    
    const levelXP = calculateXP();
    const newTotalXP = xp + levelXP;
    setXp(newTotalXP);

    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setUserInput('');
      toast.success(`Level ${currentLevel + 1} complete! +${levelXP} XP`);
    } else {
      // Completed all 5 levels naturally
      setCompletionReason('finished');
      
      // Calculate cumulative metrics using the updated history
      const metrics = calculateCumulativeMetrics();
      
      // Calculate time bonus
      let timeBonus = 0;
      const eligibleForBonus = !hasMistype && !hasSkippedLevel && !hasSkippedWord;
      
      if (eligibleForBonus && timeRemaining > 0) {
        timeBonus = timeRemaining * 5;
        toast.success(`Perfect run! Time bonus: +${timeBonus} XP (${timeRemaining}s remaining)`);
      }
      
      const finalXP = newTotalXP + timeBonus;
      setXp(finalXP);
      
      const finalMetrics: LocalChallengeMetrics = {
        ...metrics,
        xpEarned: finalXP,
      };
      setCompletionMetrics(finalMetrics);
      setIsComplete(true);
      handleChallengeComplete(finalMetrics);
    }
  };

  const handleNextLevel = () => {
    // Fix: Use the corrected typedWordsCount
    
    // If exceeded required words, show tooltip and don't advance
    if (typedWordsCount > requiredWords) {
      setShowExceededTooltip(true);
      toast.warning(`You've exceeded the required ${requiredWords} words. Please complete the level with exactly ${requiredWords} words.`);
      return;
    }
    
    // If exactly at required words, advance immediately
    if (typedWordsCount === requiredWords) {
      handleLevelComplete();
      return;
    }
    
    // If less than required words, show skip confirmation
    setShowSkipDialog(true);
  };

  const handleFinish = async () => {
    // Save current level's typed words before calculating
    const currentTypedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');
    const updatedHistory = [...levelTypedWordsHistory, { levelIndex: currentLevel, typedWords: currentTypedWords }];
    setLevelTypedWordsHistory(updatedHistory);
    
    const metrics = calculateCumulativeMetrics();
    const levelXP = calculateXP();
    const finalXP = xp + levelXP;
    
    // Check if we completed all words in the current level
    const allWordsTyped = currentTypedWords.length >= words.length;
    
    // If not all words typed or not on last level, mark as skipped
    if (!allWordsTyped || currentLevel < LEVELS.length - 1) {
      setHasSkippedWord(true);
    }
    
    setXp(finalXP);
    setCompletionReason('manual');
    
    const finalMetrics: LocalChallengeMetrics = {
      ...metrics,
      xpEarned: finalXP,
    };
    setCompletionMetrics(finalMetrics);
    setIsComplete(true);
    toast.success('Challenge finished!');
    await handleChallengeComplete(finalMetrics);
  };

  const confirmSkipLevel = () => {
    // Save current level's typed words to history before skipping
    const currentTypedWords = userInput.trim() === '' ? [] : userInput.trim().split(' ').filter(w => w !== '');
    const updatedHistory = [...levelTypedWordsHistory, { levelIndex: currentLevel, typedWords: currentTypedWords }];
    setLevelTypedWordsHistory(updatedHistory);
    
    const levelXP = calculateXP();
    const newTotalXP = xp + levelXP;
    setXp(newTotalXP);
    
    // Mark that we skipped a level
    setHasSkippedLevel(true);

    if (currentLevel < LEVELS.length - 1) {
      setCurrentLevel(currentLevel + 1);
      setUserInput('');
      setShowSkipDialog(false);
      toast.info(`Skipped to Level ${currentLevel + 2}. XP: ${newTotalXP}`);
      inputRef.current?.focus();
    }
  };

  const handleChallengeComplete = async (metrics: LocalChallengeMetrics) => {
    try {
      await saveChallengeSession.mutateAsync(metrics);
      toast.success('Session saved successfully!');
    } catch (error: any) {
      console.error('Failed to save session:', error);
      toast.error('Failed to save session: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);

    const currentTypedWords = value.trim() === '' ? [] : value.trim().split(' ').filter(w => w !== '');
    if (currentTypedWords.length >= words.length && value.endsWith(' ')) {
      handleLevelComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Pasting is not allowed!');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    toast.error('Drag and drop is not allowed!');
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCompletionMessage = () => {
    switch (completionReason) {
      case 'timeout':
        return 'Time ran out! Your progress has been saved.';
      case 'manual':
        return 'You finished the challenge early!';
      case 'finished':
        return 'Great job on completing the typing challenge';
      default:
        return 'Challenge complete!';
    }
  };

  const getWPMDisplay = (metrics: LocalChallengeMetrics): string => {
    const elapsedSeconds = TOTAL_TIME_LIMIT - timeRemaining;
    if (elapsedSeconds < 60) {
      return 'not available (test duration < 60 secs)';
    }
    return metrics.wpm.toString();
  };

  if (!isStarted) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold">Typing Challenge</h2>
          <p className="text-muted-foreground">
            Test your typing speed and accuracy across 5 progressive levels
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Challenge Rules</CardTitle>
            <CardDescription>Read carefully before starting</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                Objective
              </h3>
              <p className="text-sm text-muted-foreground">
                Type the displayed text as accurately as possible. Progress through 5 levels of increasing difficulty.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Scoring
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Correct word: +5 XP</li>
                <li>Incorrect word: -10 XP</li>
                <li>Perfect run bonus: +5 XP per second remaining</li>
              </ul>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Limit
              </h3>
              <p className="text-sm text-muted-foreground">
                You have 10 minutes total to complete all 5 levels. Time bonus only applies if you complete all levels
                without mistakes or skips.
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Anti-cheat measures are active. Pasting, drag-and-drop, and right-click are disabled.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button onClick={handleStart} size="lg" className="gap-2">
            <Trophy className="h-5 w-5" />
            Start Challenge
          </Button>
          <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
            <Home className="h-5 w-5" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  if (isComplete && completionMetrics) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold flex items-center justify-center gap-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
            Challenge Complete!
          </h2>
          <p className="text-muted-foreground">{getCompletionMessage()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Results</CardTitle>
            <CardDescription>Performance summary</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg">
                  <span className="font-semibold">Total XP Earned</span>
                  <span className="text-2xl font-bold text-primary">{completionMetrics.xpEarned}</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-semibold">Accuracy</span>
                  <span className="text-xl font-bold">{completionMetrics.accuracyPercent.toFixed(1)}%</span>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-semibold whitespace-nowrap">Words Per Minute</span>
                  <span className="text-xl font-bold whitespace-nowrap">{getWPMDisplay(completionMetrics)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-green-500/10 rounded-lg">
                  <span className="font-semibold">Correct Words</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    {completionMetrics.correctWords}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-red-500/10 rounded-lg">
                  <span className="font-semibold">Mistyped Words</span>
                  <span className="text-xl font-bold text-red-600 dark:text-red-400">
                    {completionMetrics.mistypedWords}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <span className="font-semibold">Untyped Words</span>
                  <span className="text-xl font-bold">{completionMetrics.untypedWords}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center gap-4">
          <Button onClick={handleStart} size="lg" className="gap-2">
            <Trophy className="h-5 w-5" />
            Try Again
          </Button>
          <Button onClick={onReturn} variant="outline" size="lg" className="gap-2">
            <Home className="h-5 w-5" />
            Back to Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Level {currentLevel + 1} of {LEVELS.length}</h2>
          <p className="text-sm text-muted-foreground">
            Type at least {requiredWords} words to proceed
          </p>
        </div>
        <div className="text-right space-y-1">
          <div className="flex items-center gap-2 justify-end">
            <Clock className="h-5 w-5" />
            <span className="text-2xl font-bold">{formatTime(timeRemaining)}</span>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <Zap className="h-4 w-4" />
            <span className="text-lg font-semibold">{xp} XP</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Text</CardTitle>
          <CardDescription>Type the text below as accurately as possible</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-lg leading-relaxed font-mono">{currentLevelData.text}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress: {typedWordsCount} / {requiredWords} words</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Input</label>
            <TooltipProvider>
              <Tooltip open={showExceededTooltip}>
                <TooltipTrigger asChild>
                  <Input
                    ref={inputRef}
                    value={userInput}
                    onChange={handleInputChange}
                    onPaste={handlePaste}
                    onDrop={handleDrop}
                    onContextMenu={handleContextMenu}
                    placeholder="Start typing here..."
                    className="font-mono text-lg"
                    autoFocus
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="bg-destructive text-destructive-foreground">
                  <p>You've exceeded {requiredWords} words. Complete the level with exactly {requiredWords} words.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between gap-4">
        <Button onClick={onReturn} variant="outline" className="gap-2">
          <Home className="h-4 w-4" />
          Exit
        </Button>
        <div className="flex gap-2">
          <Button onClick={handleFinish} variant="secondary" className="gap-2">
            Finish Now
          </Button>
          <Button onClick={handleNextLevel} className="gap-2">
            {currentLevel < LEVELS.length - 1 ? (
              <>
                Next Level
                <SkipForward className="h-4 w-4" />
              </>
            ) : (
              <>
                Complete
                <CheckCircle className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      <AlertDialog open={showSkipDialog} onOpenChange={setShowSkipDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip to Next Level?</AlertDialogTitle>
            <AlertDialogDescription>
              You haven't typed the required {requiredWords} words yet. Skipping will forfeit the time bonus and may
              reduce your XP. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSkipLevel}>Skip Level</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
