/**
 * WORD BREACH — Main Entry
 * Scene-based navigation shell.
 */

import { SceneManager } from './scenes/SceneManager';
import { LoadingScene } from './scenes/LoadingScene';
import { HomeScene } from './scenes/HomeScene';
import { GameScene } from './scenes/GameScene';
import { SceneWrapper } from './scenes/SceneWrapper';
import { StandardMenuScene } from './scenes/StandardMenuScene';
import { MinigameScene } from './scenes/MinigameScene';

export default function App() {
  return (
    <SceneManager
      renderScene={({ currentScene, params, goTo, exitGame }) => {
        switch (currentScene) {
          case 'loading':
            return (
              <SceneWrapper sceneKey="loading">
                <LoadingScene onComplete={() => goTo('home')} />
              </SceneWrapper>
            );

            case 'home':
            return (
              <SceneWrapper sceneKey="home">
                <HomeScene
                  onPlayStandard={() => goTo('standard-menu')}
                  onPlayEndless={() => goTo('game', { mode: 'endless' })}
                  onPlayMinigame={() => goTo('minigame')} // <--- THÊM DÒNG NÀY
                />
              </SceneWrapper>
            );

          case 'standard-menu':
            return (
              <SceneWrapper sceneKey="standard-menu">
                <StandardMenuScene
                  onBack={() => goTo('home')}
                  onSelectLevel={(levelId) =>
                    goTo('game', { mode: 'secret-password', level: levelId })
                  }
                />
              </SceneWrapper>
            );

          case 'game':
            return (
              <SceneWrapper sceneKey={`game-${params.mode ?? 'endless'}`}>
                <GameScene
                  mode={params.mode ?? 'endless'}
                  level={params.level}
                  onExit={exitGame}
                />
              </SceneWrapper>
            );

            case 'minigame':
            return (
              <SceneWrapper sceneKey="minigame">
                <MinigameScene onBack={() => goTo('home')} />
              </SceneWrapper>
            );

          default:
            return null;
        }
      }}
    />
  );
}