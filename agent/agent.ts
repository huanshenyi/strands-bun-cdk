import { Agent, BedrockModel, tool } from '@strands-agents/sdk'
import { z } from 'zod'

const weatherTool = tool({
    name: 'get_weather',
    description: 'Get the current weather for a specific location.',
    inputSchema: z.object({
        location: z.string().describe('The city and state, e.g., San Francisco, CA'),
    }),
    callback: (input) => {
        const fakeWeatherData = {
            temperature: '72°F',
            conditions: 'sunny',
        }

        return `The weather in ${input.location} is ${fakeWeatherData.temperature} and ${fakeWeatherData.conditions}.`
    },
})

const model = new BedrockModel({
    region: 'us-east-1',
    modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
})

export const agent = new Agent({
    systemPrompt: 'You are a helpful assistant that provides weather information using the get_weather tool.',
    model,
    tools: [weatherTool],
    printer: false,
})