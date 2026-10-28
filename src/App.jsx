import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  Mic,
  Square,
  Copy,
  Trash2,
  Globe,
  Info,
  CircleCheck,
  CircleAlert,
  CircleX,
  CirclePause,
  Eraser,
  TriangleAlert,
} from "lucide-react";
import LanguageSelect from "./LanguageSelect";
import "./App.css";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

export default function App() {
  const supported = Boolean(SpeechRecognition);

  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState({
    name: "Bangla (Bangladesh)",
    code: "bn-BD",
  });
  const [status, setStatus] = useState(
    supported
      ? { Icon: Info, message: "Ready" }
      : {
          Icon: TriangleAlert,
          message: "Your browser is not supported. Please use Chrome.",
        }
  );

  // useRef: values that must survive re-renders without causing one
  const recognitionRef = useRef(null);
  const finalTextRef = useRef("");
  const languageRef = useRef("bn-BD");
  const restartPendingRef = useRef(false);

  // Create the recognition object once, when the page loads
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = languageRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus({
        Icon: AudioLines,
        message: "Listening... speak now",
      });
    };

    recognition.onend = () => {
      setIsListening(false);

      // If the language was changed while listening, restart with the new one
      if (restartPendingRef.current) {
        restartPendingRef.current = false;
        recognition.lang = languageRef.current;
        recognition.start();
        return;
      }

      setStatus({ Icon: CirclePause, message: "Stopped" });
    };

    recognition.onresult = (event) => {
      let interimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTextRef.current += transcript + " ";
        } else {
          interimText += transcript;
        }
      }

      setText(finalTextRef.current + interimText);
    };

    recognition.onerror = (event) => {
      restartPendingRef.current = false;
      setStatus({
        Icon: CircleX,
        message: "Error: " + event.error,
      });
    };

    recognitionRef.current = recognition;

    // Cleanup when the component is removed
    return () => {
      recognition.onstart = null;
      recognition.onend = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.abort();
    };
  }, []);

  const handleStart = () => {
    if (isListening) return;

    try {
      recognitionRef.current.lang = languageRef.current;
      recognitionRef.current.start();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStop = () => {
    restartPendingRef.current = false;
    recognitionRef.current.stop();
  };

  const handleCopy = async () => {
    if (text.trim() === "") {
      setStatus({
        Icon: CircleAlert,
        message: "Nothing to copy",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus({
        Icon: CircleCheck,
        message: "Copied to clipboard!",
      });
    } catch (error) {
      setStatus({ Icon: CircleX, message: "Could not copy" });
    }
  };

  const handleClear = () => {
    finalTextRef.current = "";
    setText("");
    setStatus({ Icon: Eraser, message: "Everything cleared" });
  };

  // If the user types in the box manually, keep our saved text in sync
  const handleTextChange = (event) => {
    setText(event.target.value);
    finalTextRef.current = event.target.value;
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    languageRef.current = lang.code;

    if (isListening) {
      restartPendingRef.current = true;
      recognitionRef.current.stop();
    } else {
      setStatus({ Icon: Globe, message: "Language: " + lang.name });
    }
  };

  return (
    <div className="card">
      <div className="logo">
        <AudioLines size={30} strokeWidth={2} />
      </div>
      <h1>Voice to Text</h1>
      <p className="subtitle">Speak in any language and watch it turn into text</p>

      <div className="language-box">
        <label>
          <Globe size={16} /> Language
        </label>
        <LanguageSelect
          selected={language}
          onSelect={handleLanguageSelect}
          disabled={!supported}
        />
      </div>

      <div className="buttons">
        <button
          className={`btn start ${isListening ? "recording" : ""}`}
          onClick={handleStart}
          disabled={!supported}
        >
          <Mic size={18} /> Start
        </button>
        <button className="btn stop" onClick={handleStop} disabled={!supported}>
          <Square size={16} fill="currentColor" /> Stop
        </button>
      </div>

      <p className="status">
        <status.Icon size={18} /> <span>{status.message}</span>
      </p>

      <textarea
        placeholder="Your words will appear here..."
        value={text}
        onChange={handleTextChange}
      />

      <div className="actions">
        <button className="btn copy" onClick={handleCopy}>
          <Copy size={18} /> Copy
        </button>
        <button className="btn clear" onClick={handleClear}>
          <Trash2 size={18} /> Clear
        </button>
      </div>
    </div>
  );
}
