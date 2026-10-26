# Sweet Tea Satellite listening page

Static GitHub Pages subdirectory. Proposed public route after merge/deployment: https://wrightclickstudio.com/sweet-tea-satellite/ . The repository CNAME is wrightclickstudio.com, so the github.io host is not the campaign URL.

No build step. Serve the repository root with a local static server. Assets and CSS stay scoped to this path. No existing homepage files are changed. UTM labels are allowlisted and propagated to music destinations; Apple track IDs are preserved. A `song` query marks a matching track, and `#songs` takes visitors to the list. No analytics is collected. See ../social/sweet-tea-satellite/MANAGER.md for operating instructions and measurement limits.

Photo: a still extracted from the existing licensed Pexels moon clip https://www.pexels.com/video/854739/ . Source stock credits are retained locally in the original music-video project. Fonts are the existing project’s Rye and Montserrat copies, released under the SIL Open Font License. Do not present this stock moon footage as original band photography.

Deployment check: after merge, confirm GitHub Pages deployment succeeds, request the final route, inspect the page on mobile and check Spotify, HyperFollow and song destinations. Only then place campaign URLs in live profiles. Branch preview is not production publication.


## October 26 production revision

The ?song= query selects a verified EP track in the primary listening panel. Every EP song now has a direct Spotify link and Apple Music choice. Brown Mountain Lights uses the Apple EP page until its individual Apple track identifier is independently verified; it is explicitly labeled EP. Amazon/other services open the existing HyperFollow EP page. Static default is Porch Light Goes Out. Incoming campaign labels are allowlisted and preserved when choosing another song; Apple i identifiers stay intact.

No analytics collector is configured. HyperFollow supplies its own aggregate page-view counters for traffic reaching it. These do not measure this page’s visits or direct Spotify/Apple button clicks; do not claim otherwise. A connected analytics property remains necessary for those metrics.
