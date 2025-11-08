'use server';
/**
 * @fileOverview Dynamically adjusts text illumination based on the nearest planet's light.
 *
 * - adjustTextIllumination - A function that calculates the appropriate illumination for text based on proximity to planets.
 * - AdjustTextIlluminationInput - The input type for the adjustTextIllumination function.
 * - AdjustTextIlluminationOutput - The return type for the adjustTextIllumination function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustTextIlluminationInputSchema = z.object({
  text: z.string().describe('The text content to be illuminated.'),
  planetDistance: z.number().describe('The distance between the text and the nearest planet.'),
  planetLightIntensity: z.number().describe('The light intensity of the nearest planet.'),
  baseFontSize: z.number().describe('The base font size of the text in pixels.'),
});
export type AdjustTextIlluminationInput = z.infer<typeof AdjustTextIlluminationInputSchema>;

const AdjustTextIlluminationOutputSchema = z.object({
  adjustedFontSize: z.number().describe('The adjusted font size in pixels to ensure readability.'),
  textColor: z
    .string()
    .describe(
      'The color of the text, as a hex string. Should be white or a light shade of the page background.'
    ),
});
export type AdjustTextIlluminationOutput = z.infer<typeof AdjustTextIlluminationOutputSchema>;

export async function adjustTextIllumination(
  input: AdjustTextIlluminationInput
): Promise<AdjustTextIlluminationOutput> {
  return adjustTextIlluminationFlow(input);
}

const adjustTextIlluminationPrompt = ai.definePrompt({
  name: 'adjustTextIlluminationPrompt',
  input: {schema: AdjustTextIlluminationInputSchema},
  output: {schema: AdjustTextIlluminationOutputSchema},
  prompt: `You are an expert in UI design, specializing in readability and accessibility in 3D environments.

  Given the following information about a text element and its proximity to a light source (a planet), determine the optimal font size and text color to ensure readability.

  Text: {{{text}}}
  Distance to Planet: {{{planetDistance}}}
  Planet Light Intensity: {{{planetLightIntensity}}}
  Base Font Size: {{{baseFontSize}}}px

  Consider these factors:
  - **Contrast:** Ensure sufficient contrast between the text and the dark background.
  - **Light Intensity:** Adjust the font size and color based on the planet's light. If the light is dim, increase the font size and lighten the text color.
  - **Distance:** As the text moves farther from the planet, increase the font size to compensate for perceived distance.

  Provide the adjusted font size in pixels and the text color as a hex code. The background is dark, desaturated blue-gray (#12182B).

  Example Output:
  \{
    "adjustedFontSize": 24,
    "textColor": "#FFFFFF"
  \}

  Ensure that the output is valid JSON.
  `,
});

const adjustTextIlluminationFlow = ai.defineFlow(
  {
    name: 'adjustTextIlluminationFlow',
    inputSchema: AdjustTextIlluminationInputSchema,
    outputSchema: AdjustTextIlluminationOutputSchema,
  },
  async input => {
    const {output} = await adjustTextIlluminationPrompt(input);
    return output!;
  }
);
