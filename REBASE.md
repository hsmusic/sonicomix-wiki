# Stuck in rebasing hell?

Fear no more!

## Remove unused files

Run these to cut out a bunch of files that sonicomix's base doesn't use. This *won't* necessarily get everything, but should take care of a lot of it and make the remaining `git status` easier to browse.

```
# Remove additional files

git rm src/data/things/additional-file.js

git rm src/content/dependencies/generateAdditionalFile*
git rm src/content/dependencies/linkAdditionalFile*
git rm src/content/dependencies/listAllAdditionalFiles*

# Remove albums

git rm src/content/dependencies/generateAlbum*
git rm src/content/dependencies/linkAlbum*
git rm src/content/dependencies/listAlbum*
git rm src/content/dependencies/generateCommentaryIndexPage.js

git rm src/data/things/album.js

git rm src/page/album.js

git rm src/static/js/client/album-commentary-sidebar.js
git rm src/static/js/client/gallery-style-selector.js

# Remove artist rolling window

git rm src/content/dependencies/generateArtistRollingWindowPage.js

git rm src/static/js/client/artist-rolling-window.js

# Remove art tags

git rm src/content/dependencies/generateArtTag*
git rm src/content/dependencies/linkArtTag*
git rm src/content/dependencies/listArtTag*

git rm src/data/things/art-tag.js

git rm src/page/art-tag.js

git rm src/static/js/client/art-tag-gallery-filter.js
git rm src/static/js/client/art-tag-network.js
git rm src/static/js/client/reveal-all-grid-control.js

# Remove flashes

git rm src/content/dependencies/generateFlash*
git rm src/content/dependencies/generateArtistInfoPageFlashesChunkedList.js
git rm src/content/dependencies/linkFlash*

git rm src/data/things/flash.js

git rm src/page/flash.js
git rm src/page/flash-act.js

# Remove groups

git rm src/content/dependencies/generateGroup*
git rm src/content/dependencies/linkGroup*
git rm src/content/dependencies/listGroups*

git rm src/content/dependencies/generateArtistGroupContributionsInfo.js
git rm src/content/dependencies/listArtistsByGroup.js

git rm src/data/things/group.js

git rm src/page/group.js

git rm src/static/js/group-contributions-table.js

# Remove tracks

git rm src/content/dependencies/generateTrack*
git rm src/content/dependencies/linkTrack*
git rm src/content/dependencies/listTrack*

git rm src/data/things/track.js
git rm -r src/data/composite/things/track/

git rm src/content/dependencies/generateArtistInfoPageTracksChunkedList.js
git rm src/content/dependencies/listArtistsByDuration.js
git rm src/content/dependencies/listArtistsByLatestContribution.js

git rm src/page/track.js
```
