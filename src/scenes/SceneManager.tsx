import React, { useCallback, useState } from 'react';
import { SceneId, SceneParams, GameMode } from '../game/types';

interface SceneManagerRender {
    currentScene: SceneId;
    params: SceneParams;
    goTo: (scene: SceneId, params?: SceneParams) => void;
    exitGame: () => void;
    completeLevel: (levelId: number, score: number, maxScore: number) => void;
}

interface SceneManagerProps {
    renderScene: (ctx: SceneManagerRender) => React.ReactNode;
    initialScene?: SceneId;
}

/**
 * State-based scene navigation. No router.
 * Parent passes `renderScene` callback to decide what to render per scene.
 */
export function SceneManager({ renderScene, initialScene = 'loading' }: SceneManagerProps) {
    const [currentScene, setCurrentScene] = useState<SceneId>(initialScene);
    const [params, setParams] = useState<SceneParams>({});

    const goTo = useCallback((scene: SceneId, newParams: SceneParams = {}) => {
        setCurrentScene(scene);
        setParams(newParams);
    }, []);

    const exitGame = useCallback(() => {
        goTo('home');
    }, [goTo]);

    const handleCompleteLevel = useCallback((levelId: number, score: number, maxScore: number) => {
        // Lazy import to avoid circular deps
        import('../game/storage').then(({ completeLevel }) => {
            completeLevel(levelId, score, maxScore);
            goTo('standard-menu');
        });
    }, [goTo]);

    return (
        <>
            {renderScene({
                currentScene,
                params,
                goTo,
                exitGame,
                completeLevel: handleCompleteLevel,
            })}
        </>
    );
}