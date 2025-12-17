/**
 * Migration utility to fix tokens missing userId field
 *
 * PROBLEM: Tokens created before the fix have characterId but no userId,
 * which breaks HP sync because the character listener setup requires BOTH.
 *
 * SOLUTION: For all tokens with characterId but no userId, set userId = characterId
 * (since characterId IS the userId for player character tokens)
 *
 * HOW TO RUN:
 * 1. Import this function in your component (e.g., VTTSession or DevTools)
 * 2. Call it once: await fixTokenUserIds(firestore, campaignId);
 * 3. Check console for "✅ Fixed N tokens"
 * 4. Remove the import after running once
 */

import { collection, getDocs, doc, writeBatch } from "firebase/firestore";

export async function fixTokenUserIds(firestore, campaignId) {
  console.log("🔧 Starting token userId migration for campaign:", campaignId);

  try {
    // Get all maps in campaign
    const mapsRef = collection(firestore, "campaigns", campaignId, "maps");
    const mapsSnapshot = await getDocs(mapsRef);

    let totalFixed = 0;

    for (const mapDoc of mapsSnapshot.docs) {
      const mapId = mapDoc.id;
      console.log(`🔧 Checking tokens in map: ${mapId}`);

      // Get all tokens in this map (VTT path)
      const tokensRef = collection(
        firestore,
        "campaigns",
        campaignId,
        "vtt",
        mapId,
        "tokens"
      );
      const tokensSnapshot = await getDocs(tokensRef);

      const batch = writeBatch(firestore);
      let batchCount = 0;
      let mapFixedCount = 0;

      for (const tokenDoc of tokensSnapshot.docs) {
        const tokenData = tokenDoc.data();

        // Check if token has characterId but no userId
        if (tokenData.characterId && !tokenData.userId) {
          console.log(`🔧 Fixing token: ${tokenData.name} (${tokenDoc.id})`);
          console.log(`   - characterId: ${tokenData.characterId}`);
          console.log(`   - Setting userId: ${tokenData.characterId}`);

          const tokenRef = doc(
            firestore,
            "campaigns",
            campaignId,
            "vtt",
            mapId,
            "tokens",
            tokenDoc.id
          );
          batch.update(tokenRef, {
            userId: tokenData.characterId,
          });

          batchCount++;
          mapFixedCount++;

          // Firestore batch limit is 500 operations
          if (batchCount >= 500) {
            await batch.commit();
            console.log(`✅ Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
        }
      }

      // Commit remaining updates for this map
      if (batchCount > 0) {
        await batch.commit();
        console.log(
          `✅ Committed final batch of ${batchCount} updates for map ${mapId}`
        );
      }

      if (mapFixedCount > 0) {
        console.log(`✅ Fixed ${mapFixedCount} token(s) in map ${mapId}`);
        totalFixed += mapFixedCount;
      } else {
        console.log(`✓ No tokens needed fixing in map ${mapId}`);
      }
    }

    console.log(
      `✅ Token userId migration complete! Fixed ${totalFixed} token(s) total.`
    );

    if (totalFixed > 0) {
      console.log("🎉 HP sync should now work! Refresh the page and test:");
      console.log("   1. Right-click token and change HP");
      console.log("   2. Check character sheet and party panel update");
      console.log("   3. Change HP in character sheet");
      console.log("   4. Check token and party panel update");
    } else {
      console.log(
        "ℹ️ No tokens needed fixing. If HP sync still broken, check:"
      );
      console.log("   1. Token has both characterId AND userId in Firestore");
      console.log(
        "   2. Character document exists at campaigns/{campaignId}/characters/{userId}"
      );
      console.log("   3. Console logs show character listeners being set up");
    }

    return totalFixed;
  } catch (error) {
    console.error("❌ Error fixing token userIds:", error);
    throw error;
  }
}
