import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WSClient } from '@/network/wsClient.ts'

export const useGMStore = defineStore('GameManager', () => {

  const wsClient = new WSClient();

  return { wsClient,
          }
})
