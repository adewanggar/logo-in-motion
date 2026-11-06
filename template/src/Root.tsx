import React from 'react';
import {AbsoluteFill, Composition, Folder, continueRender, delayRender, staticFile} from 'remotion';
import {loadFont} from '@remotion/fonts';
import {BRAND} from './brand';
import {DEFAULT_PROPS, type BumperDef, type BumperProps} from './bumpers/common';
import {DEF as InkDraw} from './bumpers/InkDraw';
import {DEF as Assemble} from './bumpers/Assemble';
import {DEF as PopLockup} from './bumpers/PopLockup';
import {DEF as Collapse} from './bumpers/Collapse';
import {DEF as Sheen} from './bumpers/Sheen';
import {DEF as Slam} from './bumpers/Slam';
import {DEF as Converge} from './bumpers/Converge';
import {Lockup, useLockupLayout} from './components/Lockup';
import {LogoMark} from './components/LogoMark';
import {Stage} from './components/Stage';
import {makeTimeline} from './lib/timeline';
import {LOGO} from './logo/parts';

export const BUMPERS: BumperDef[] = [InkDraw, Assemble, PopLockup, Collapse, Sheen, Slam, Converge];

export const FPS = 30;
export const ASPECTS = {
  '16x9': {width: 1920, height: 1080},
  '9x16': {width: 1080, height: 1920},
  '1x1': {width: 1080, height: 1080},
} as const;

// Brand font: loaded once, blocks rendering until ready (deterministic text metrics).
if (BRAND.font.file) {
  const handle = delayRender('brand font');
  loadFont({family: BRAND.font.family.split(',')[0].replace(/"/g, '').trim(), url: staticFile(BRAND.font.file), weight: String(BRAND.font.weight)})
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

/** The static lockup — the Final Frame Contract reference. No animation at all. */
const LogoStill: React.FC<BumperProps> = (props) => {
  const L = useLockupLayout(BRAND);
  const tl = makeTimeline(60, FPS, {outro: 'hold'});
  return (
    <Stage brand={BRAND} tl={tl} outro="hold" transparent={props.transparent} grain={props.grain}>
      <Lockup brand={BRAND} layout={L} showTagline={props.showTagline} />
    </Stage>
  );
};

/** Logo alone at its intrinsic viewBox size (× scale) on transparent bg — for IoU overlay vs the source raster. */
const LogoCheck: React.FC<{width: number; height: number}> = ({width, height}) => (
  <AbsoluteFill style={{backgroundColor: 'transparent'}}>
    <LogoMark size={height} style={{width, height}} />
  </AbsoluteFill>
);

export const Root: React.FC = () => {
  const [, , vbW, vbH] = LOGO.viewBox;
  return (
    <>
      {Object.entries(ASPECTS).map(([key, size]) => (
        <Folder key={key} name={`bumpers-${key}`}>
          {BUMPERS.map((b) => (
            <Composition
              key={b.id}
              id={`${b.id}-${key}`}
              component={b.component}
              durationInFrames={Math.round(b.seconds * FPS)}
              fps={FPS}
              width={size.width}
              height={size.height}
              defaultProps={DEFAULT_PROPS}
              calculateMetadata={({props}) => {
                const dur = Math.round((props.seconds ?? b.seconds) * FPS);
                return {
                  durationInFrames: dur,
                  props: {...props, _markers: b.markers(makeTimeline(dur, FPS, {outro: props.outro, ...b.timeline}))},
                };
              }}
            />
          ))}
          <Composition
            id={`LogoStill-${key}`}
            component={LogoStill}
            durationInFrames={1}
            fps={FPS}
            width={size.width}
            height={size.height}
            defaultProps={DEFAULT_PROPS}
          />
        </Folder>
      ))}
      <Folder name="qa">
        <Composition
          id="LogoCheck"
          component={LogoCheck}
          durationInFrames={1}
          fps={FPS}
          width={vbW}
          height={vbH}
          defaultProps={{width: vbW, height: vbH}}
          calculateMetadata={({props}) => ({width: Math.round(props.width), height: Math.round(props.height)})}
        />
      </Folder>
    </>
  );
};
