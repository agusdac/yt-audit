<script setup lang="ts">
import { ref } from 'vue'
import type { VideoDetails } from '~~/types/youtube'

const channelHandle = ref('@ludwig')
const isLoading = ref(false)
const videoDetails = ref<VideoDetails[]>([]) // Store the final video IDs

async function runAudit() {
    isLoading.value = true
    videoDetails.value = [] // Reset the UI

    try {
        // --- STEP 1: Get the Uploads Playlist ID ---
        console.log(`1. Finding playlist ID for ${channelHandle.value}...`)
        /* const playlistResponse: any = await $fetch('/api/get-uploads-playlist', {
            query: { handle: channelHandle.value }
        }) */

        //const playlistId = playlistResponse.uploadsPlaylistId
        const playlistId = 'UUrPseYLGpNygVi34QpGNqpA'
        console.log(`✅ Playlist ID found: ${playlistId}`)

        // --- STEP 2: Paginate the Playlist for Video IDs ---
        console.log(`2. Scraping video IDs from playlist... (This might take a few seconds)`)
        const videosResponse: any = await $fetch('/api/video-details', {
            query: { playlistId: playlistId }
        })

        videoDetails.value = videosResponse.videos

        console.log(`✅ SUCCESS! Scraped ${videosResponse.totalVideosScraped} videos.`)
        console.log('Here is the array of Video IDs:', videoDetails.value)

    } catch (error) {
        console.error('❌ Error during audit:', error)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div style="padding: 40px;">
        <h1>YouTube Auditor MVP</h1>
        <p>Enter a channel handle to scrape their back-catalog Video IDs.</p>

        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
            <input v-model="channelHandle" placeholder="@channelhandle" style="padding: 8px; font-size: 16px;" />
            <button @click="runAudit" :disabled="isLoading"
                style="padding: 8px 16px; font-size: 16px; cursor: pointer; background-color: #00dc82; color: white; border: none; border-radius: 4px;">
                {{ isLoading ? 'Scraping...' : 'Run Audit' }}
            </button>
        </div>

        <div v-if="videoDetails.length > 0"
            style="margin-top: 20px; padding: 20px; background: #f4f4f5; border-radius: 8px;">
            <h3 style="margin-top: 0;">Audit Complete</h3>
            <p>Successfully scraped <strong>{{ videoDetails.length }}</strong> videos.</p>
            <p style="color: gray; font-size: 14px;"><em>Check your browser's Developer Console to see the raw array of
                    IDs!</em></p>
        </div>
    </div>
</template>
