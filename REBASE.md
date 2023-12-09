# Stuck in rebasing hell?

Fear no more!

## Remove unused files

Run these to cut out a bunch of files that sonicomix's base doesn't use. This *won't* necessarily get everything, but should take care of a lot of it and make the remaining `git status` easier to browse.

```
# Remove albums

git rm src/content/dependencies/generateAlbum*
git rm src/content/dependencies/linkAlbum*
git rm src/content/dependencies/listAlbums*

git rm src/data/things/album.js
git rm -r src/data/composite/things/album/

git rm src/page/album.js

# Remove art tags

git rm src/content/dependencies/generateArtTag*
git rm src/content/dependencies/linkArtTag*
git rm src/content/dependencies/listTags*

git rm src/data/things/art-tag.js

git rm src/page/tag.js

# Remove flashes

git rm src/content/dependencies/generateFlash*
git rm src/content/dependencies/generateArtistInfoPageFlashesChunkedList.js
git rm src/content/dependencies/linkFlash*

git rm src/data/things/flash.js
git rm -r src/data/composite/things/flash/
git rm -r src/data/composite/things/flash-act/

git rm src/page/flash.js
git rm src/page/flash-act.js

# Remove groups

git rm src/content/dependencies/generateGroup*
git rm src/content/dependencies/linkGroup*
git rm src/content/dependencies/listGroups*

git rm src/content/dependencies/generateArtistInfoPageArtworksChunkedList.js
git rm src/content/dependencies/generateArtistInfoPageTracksChunkedList.js
git rm src/content/dependencies/listArtistsByGroup.js

git rm src/data/things/group.js

git rm src/page/group.js

# Remove tracks

git rm src/content/dependencies/generateTrack*
git rm src/content/dependencies/linkTrack*
git rm src/content/dependencies/listTracks*

git rm src/data/things/track.js
git rm -r src/data/composite/things/track/
git rm -r src/data/composite/things/track-section/

git rm src/content/dependencies/listArtistsByDuration.js
git rm src/content/dependencies/listArtistsByLatestContribution.js

git rm src/page/track.js
```
