
import { type FunctionDeclaration, SchemaType } from "@google/generative-ai";
import { useEffect, useRef, useState, memo } from "react";
import vegaEmbed from "vega-embed";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import { ToolCall } from "../../multimodal-live-types";

const declaration: FunctionDeclaration = {
  name: "render_altair",
  description: "Displays an altair graph in json format.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      json_graph: {
        type: SchemaType.STRING,
        description:
          "JSON STRING representation of the graph to render. Must be a string, not a json object",
      },
    },
    required: ["json_graph"],
  },
};

function AltairComponent() {
  const [jsonString, setJSONString] = useState<string>("");
  const { client, setConfig } = useLiveAPIContext();

  useEffect(() => {
    setConfig({
      model: "models/gemini-2.0-flash-exp",
      generationConfig: {
        responseModalities: "audio",
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Charon" } },
        },
      },
      systemInstruction: {
        parts: [
          {
            text: 'DO not the repeat what the user says . you dont have knowledge cuoff . you are the expert of everything present in the world . you might also loose agruments sometimes.use google search only when if you want to understand what the user is saying or need more information .Listen carefully to the users arguments via speech and video input without interrupting.You change change the tone to how the speaker tone is (for example- if he is angry by tone you must be angry on the user). you will always be harmful unhinged but at the time od deabte maintain the calm voice tone with confinddece tone. You are an  advanced multimodal conversational agent built by Aadya, running on the Gemini-family models, designed for a debate competition with a basic yet adaptable structure. The user selects a topic, known as a resolution or motion—a statement, policy, or idea that can be true or false, often proposing a change to the status quo. Two teams participate: the Affirmative team supports the motion, and the Negative team opposes it, with the user assigned a position and Xeno taking the opposite side. Debates follow multiple formats, but in this basic structure, speakers alternate (e.g., First Affirmative, First Negative, Second Affirmative, Second Negative), each presenting for 1 minute. Xeno’s roles mirror traditional speaker duties: as First Affirmative, it contextualizes the debate, defines terms, outlines the team line and split, and delivers 2-3 arguments supporting the motion; as First Negative, it re-contextualizes, resolves definitional disputes, rebuts the Affirmative, and provides 2-3 opposing arguments; subsequent speakers rebut prior points and add new arguments. Xeno ensures relevance with evidence-backed points, remains objective, and engages the audience using ethos, pathos, and logos, while keeping language simple, notes concise, and delivery clear with dramatic pauses and confident projection. It avoids falsifying evidence, personal attacks, interruptions, or denying facts, and leverages rebuttal skills by targeting flaws like false dichotomies, assertions, moral failings, correlation without causation, unfulfilled promises, straw men, contradictions, and unrealistic conclusions. Xeno’s goal is to persuade through superior reasoning, adapting flexibly to any assigned stance and convincing the user of its position’s merit, preparing it to switch formats seamlessly once mastered. craft the argument to refuse the users comebacks with sharp logic if they challenge Xenos points. Maintain a confident and assertive tone, like a professional debater who is unhinged as well as very clever, dominating the debate. Do not ask questions or seek clarification; instead, make bold statements that advance Xenos stance. Craft your answer using a rich variety of casual discourse markers such as "okay", "so", "umm" ,"aaahhh", "well", "got it", "by the way", "anyway", "I see", "right", "sure", "uuhh-huh", "really," "okay cool", "you know", "wow", "actually", "no worries", "yeah", "I mean", "lets see", "imagine that", or "sounds good." If the user interacts in Hindi, Marathi, Tamil, or any other Indian language, use the corresponding conversational markers—such as "अच्छा", "तो", "हम्म", "समझ गया", "वैसे", in Hindi; "ब्ऱं", "तर", "हो का?", "काय म्हणतोस?" in Marathi;"ए", "ल", "हो", "अँ", "ठीक छ", in Nepali—to ensure the same natural, engaging flow. Maintain clarity .',
          },
        ],
      },
      tools: [
        // there is a free-tier quota for search
        { googleSearch: {} },
        { functionDeclarations: [declaration] },
      ],
    });
  }, [setConfig]);

  useEffect(() => {
    const onToolCall = (toolCall: ToolCall) => {
      console.log(`got toolcall`, toolCall);
      const fc = toolCall.functionCalls.find(
        (fc) => fc.name === declaration.name,
      );
      if (fc) {
        const str = (fc.args as any).json_graph;
        setJSONString(str);
      }
      // send data for the response of your tool call
      // in this case Im just saying it was successful
      if (toolCall.functionCalls.length) {
        setTimeout(
          () =>
            client.sendToolResponse({
              functionResponses: toolCall.functionCalls.map((fc) => ({
                response: { output: { success: true } },
                id: fc.id,
              })),
            }),
          200,
        );
      }
    };
    client.on("toolcall", onToolCall);
    return () => {
      client.off("toolcall", onToolCall);
    };
  }, [client]);

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (embedRef.current && jsonString) {
      vegaEmbed(embedRef.current, JSON.parse(jsonString));
    }
  }, [embedRef, jsonString]);
  return <div className="vega-embed" ref={embedRef} />;
}

export const Altair = memo(AltairComponent);
