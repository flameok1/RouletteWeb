import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { WSClient } from '@/network/wsClient.ts'
import { MessageHandle } from '@/network/MessageHandle';

export const useGMStore = defineStore('GameManager', () => {

  const wsClient = new WSClient();
  const messageHandle = new MessageHandle();

  return { wsClient,
           messageHandle,
          }
})
