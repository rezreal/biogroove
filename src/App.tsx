import './App.css';

import { useEffect, useState} from "react";
import OIDC, { UserManager, UserManagerSettings} from "oidc-client";
import SpotifyWebApi from "spotify-web-api-js";
import spotifyLogo from "./Spotify_Logo_RGB_Green.png"
import {AudioAnalysis, StructuredAudioAnalysis} from "./Analysis";

function getLocalStorageOrDefault<T>(key:any, defaultValue: T): T {
  const stored = localStorage.getItem(key);
  if (!stored) {
    return defaultValue;
  }
  return JSON.parse(stored) as T;
}


function App() {

  const [params] = useState<{
    minDepth: number,
    maxDepth: number,
    speed: number,
    showStats: boolean,
    program: 'palm' | 'pi' | undefined
  }>(getLocalStorageOrDefault('params',{minDepth: 100, maxDepth: 5000, speed: 3000, showStats: false, program: undefined}));


    const oidcSettings: UserManagerSettings = {
        automaticSilentRenew: true,
        authority: "https://accounts.spotify.com/authorize",
        metadata: {
            issuer: "https://accounts.spotify.com/authorize",
            authorization_endpoint: "https://accounts.spotify.com/authorize",
            token_endpoint: "https://accounts.spotify.com/api/token",
        },
        client_id: "5cb73d286b4848c4a53a7b5077ae3cf4",
        redirect_uri: window.location.protocol + "//" + window.location.host + window.location.pathname,
        post_logout_redirect_uri: window.location.protocol + "//" + window.location.host + "/index",
        silent_redirect_uri: window.location.protocol + "//" + window.location.host + "/index",
        response_type: "code",
        scope: "user-read-playback-state",
        loadUserInfo: true,
        userStore: new OIDC.WebStorageStateStore({ store: window.localStorage }),

    };

    const [userManager] = useState<UserManager>(new UserManager(oidcSettings));

    const [spotifyApi] = useState(new SpotifyWebApi());

    const [user, setUser] = useState<{
        access_token: string
    } | undefined>(undefined);

    const [playingTrack, setPlayingTrack] = useState<SpotifyApi.CurrentlyPlayingResponse | undefined>(undefined);


    const [currentAnalysis, setCurrentAnalysis] = useState<[SpotifyApi.AudioFeaturesResponse, StructuredAudioAnalysis] | undefined>(undefined);



/*
  useEffect(() => {

      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      //script.onload = () => this.scriptLoaded();
      document.body.appendChild(script);

      (window as any).onSpotifyWebPlaybackSDKReady = () => {
          const token = 'BQA5NoUxZSR9tHtwy0oDLBKfn9eS36cc8nhPNxWnlKcBEayw-f6We1w7yBaObjQGKIee8p32z1x_wengBf2zkeS12r_2pA0j8dagbkK_qUIpQIykhAYnT6QGHmKqy4nXgvLU6HiYqJIf7kiIOGn8zXIo4167A1BVA1I7Pn4ogoPQCvYOSc4rel8';
          const player = new (global as any).Spotify.Player({
              name: 'Web Playback SDK Quick Start Player',
              getOAuthToken: (cb:any ) => { cb(token); }
          });

          // Error handling
          player.addListener('initialization_error', (e: any) => { console.error(e.message); });
          player.addListener('authentication_error', (e: any) => { console.error(e.message); });
          player.addListener('account_error', (e: any) => { console.error(e.message); });
          player.addListener('playback_error', (e: any) => { console.error(e.message); });

          // Playback status updates
          player.addListener('player_state_changed', (state: any) => { console.log(state); });

          // Ready
          player.addListener('ready', (e: any) => {
              console.log('Ready with Device ID', e.device_id);
          });

          // Not Ready
          player.addListener('not_ready', (e: any) => {
              console.log('Device ID has gone offline', e.device_id);
          });

          // Connect to the player!
          player.connect();
      };

  })

 */

  useEffect(() => {
    sessionStorage.setItem('params', JSON.stringify(params));
  }, [params]);

    useEffect(() => {

        async function work() {
            if (user?.access_token) {
                try {
                    const state = await spotifyApi.getMyCurrentPlayingTrack();
                    setPlayingTrack(state);

                } catch (e) {
                    console.log("failed to fetch current track", e)
                }

            }
        }
        work();

    }, [spotifyApi, userManager, user]);


    //userManager.getUser().then((u)=> u ? setUser(u) : null);

    async function reactOnLoginCallback() {
        if (window.location.href.indexOf('code=') > 0) {
            await userManager.signinRedirectCallback(window.location.href);
            window.location.href = window.location.origin
        }
    }
    reactOnLoginCallback();


  async function login() {

      const user = await userManager.getUser();
      console.log()
      if (user === null) {
          await userManager.signinRedirect();
      } else {
          console.log(user);
          spotifyApi.setAccessToken(user.access_token);
          setUser({access_token: user.access_token})
      }
  }

    async function logout() {

        const user = await userManager.getUser();
        if (user !== null) {
            await userManager.removeUser();
            window.location.reload();
        }

    }

    async function analyze() {
        const key = `track-${playingTrack!.item!.id}`;

        const stored = getLocalStorageOrDefault(key, undefined);
        let res;
        if (stored) {
            res = stored;
        } else {
            res = await spotifyApi.getAudioAnalysisForTrack(playingTrack!.item!.id);
            localStorage.setItem(key, JSON.stringify(res))
        }
        console.info("RESULT:", res)
        const analysisResult = res as AudioAnalysis;
        const mapped = organize(analysisResult);

        const featureKey = `track-features--${playingTrack!.item!.id}`;
        const featureStored = getLocalStorageOrDefault<SpotifyApi.AudioFeaturesResponse | undefined>(key, undefined);
        let featureRes: SpotifyApi.AudioFeaturesResponse;
        if (featureStored) {
            featureRes = featureStored;
        } else {
            featureRes = await spotifyApi.getAudioFeaturesForTrack(playingTrack!.item!.id);
            localStorage.setItem(featureKey, JSON.stringify(res))
        }

        setCurrentAnalysis([featureRes, mapped])

        console.info("mapped result: ", mapped)

    }


    function organize(analysis: AudioAnalysis) : StructuredAudioAnalysis {
        function within(outer: { start: number, duration: number }, inner: { start: number, duration: number }): boolean {
            return inner.start <= outer.start && inner.start + inner.duration <= outer.start + outer.duration
        }

        return {...analysis, sections: analysis.sections.map(section => (
                {
                    ...section,
                    bars: analysis.bars
                        .filter(bar => within(section, bar))
                        .map(bar =>
                            ({
                                ...bar,
                                beats: analysis.beats
                                    .filter(beat => within(bar, beat))

                            }))
                }))}
    }




  return (
    <div className="App">
        <header className="App-header">

            {!user?.access_token &&
            <div>
                <p>
                    This tool can create FunScript files for the music you are playing on spotify.
                    FunScripts are instructions for haptic human interaction feedback devices.
                </p>
                <p>
                    FunScripts can be played back with the <a href="https://github.com/FredTungsten/ScriptPlayer">ScriptPlayer</a> or
                </p>

                <p>
                    This app is powered by
                    <br/>
                    <img width={128} src={spotifyLogo} alt="Spotify" />  Audio Analysis
                </p>

                <p>Hit <code>Login with Spotify</code> to get started.</p>
                <button onClick={login}>Login with Spotify</button>
            </div>
            }


            {
                playingTrack &&
                <div>
                    Playing now:

                    {
                        playingTrack.item?.album.images[0] &&
                        <div><br /><img alt={"Album cover"} src={playingTrack.item?.album.images[0].url} width={playingTrack.item?.album.images[0].width} height={playingTrack.item?.album.images[0].height}/></div>
                    }

                    <br/><strong>{playingTrack.item?.name}</strong>
                    <br/>by: {playingTrack.item?.artists[0]?.name}
                    <br/>Album: {playingTrack.item?.album?.name}
                    <br/><button onClick={analyze}>Analyze</button>


                </div>
            }

            {
                currentAnalysis &&
                <div>
                    <dl>
                        <dt>Dancability: </dt><dd>{currentAnalysis[0].danceability}</dd>
                        <dt>Acousticness: </dt><dd>{currentAnalysis[0].acousticness}</dd>
                        <dt>Energy: </dt><dd>{currentAnalysis[0].energy}</dd>
                        <dt>Liveness: </dt><dd>{currentAnalysis[0].liveness}</dd>
                        <dt>Tempo: </dt><dd>{currentAnalysis[0].tempo}</dd>
                    </dl>


                </div>
            }

            {user?.access_token &&
            <p>
                <button onClick={logout}>Logout</button>
            </p>

            }

        </header>
    </div>
  );
}

export default App;

