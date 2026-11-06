import {Config} from '@remotion/cli/config';

// PNG frames keep edges and gradients clean on logo art; switch to 'jpeg' only for speed drafts.
Config.setVideoImageFormat('png');
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
