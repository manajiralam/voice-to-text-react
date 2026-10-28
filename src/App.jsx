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

// Mobile Chrome repeats text when "continuous" mode is on,
// so on phones we listen in short sessions and restart automatically.
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

// Join all results of one listening session into a single text.
// On mobile, a result that just extends the previous one replaces it
// (this removes the "hello hello hello" duplicates).
function buildSessionText(results) {
  const parts = [];

  for (let i = 0; i < results.length; i++) {
    const t = results[i][0].transcript.trim();
    if (!t) continue;

    const last = parts[parts.length - 1];
    if (isMobile && last && t.startsWith(last)) {
      parts[parts.length - 1] = t;
    } else {
      parts.push(t);
    }
  }

  return parts.join(" ");
}

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
  const committedRef = useRef(""); // text that is already saved
  const sessionRef = useRef(""); // text of the current listening session
  const languageRef = useRef("bn-BD");
  const wantListeningRef = useRef(false); // true until the user presses Stop

  // Move the current session text into the saved text
  const commitSession = () => {
    if (sessionRef.current) {
      committedRef.current += sessionRef.current + " ";
      sessionRef.current = "";
    }
  };

  // Create the recognition object once, when the page loads
  useEffect(() => {
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = languageRef.current;
    recognition.continuous = !isMobile;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus({ Icon: AudioLines, message: "Listening... speak now" });
    };

    recognition.onend = () => {
      commitSession();

      // Still want to listen (mobile auto-restart or language change)
      if (wantListeningRef.current) {
        try {
          recognition.lang = languageRef.current;
          recognition.start();
          return;
        } catch (error) {
          wantListeningRef.current = false;
        }
      }

      setIsListening(false);
      setStatus({ Icon: CirclePause, message: "Stopped" });
    };

    recognition.onresult = (event) => {
      sessionRef.current = buildSessionText(event.results);
      setText(committedRef.current + sessionRef.current);
    };

    recognition.onerror = (event) => {
      // These are normal: silence or a manual stop. Not real errors.
      if (event.error === "no-speech" || event.error === "aborted") return;

      wantListeningRef.current = false;
      setStatus({ Icon: CircleX, message: "Error: " + event.error });
    };

    recognitionRef.current = recognition;

    // Cleanup when the component is removed
    return () => {
      wantListeningRef.current = false;
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
      wantListeningRef.current = true;
      recognitionRef.current.lang = languageRef.current;
      recognitionRef.current.start();
    } catch (error) {
      console.error(error);
    }
  };

  const handleStop = () => {
    wantListeningRef.current = false;
    recognitionRef.current.stop();
  };

  const handleCopy = async () => {
    if (text.trim() === "") {
      setStatus({ Icon: CircleAlert, message: "Nothing to copy" });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setStatus({ Icon: CircleCheck, message: "Copied to clipboard!" });
    } catch (error) {
      setStatus({ Icon: CircleX, message: "Could not copy" });
    }
  };

  const handleClear = () => {
    committedRef.current = "";
    sessionRef.current = "";
    setText("");
    setStatus({ Icon: Eraser, message: "Everything cleared" });
  };

  // If the user types in the box manually, keep our saved text in sync
  const handleTextChange = (event) => {
    setText(event.target.value);
    committedRef.current = event.target.value;
    sessionRef.current = "";
  };

  const handleLanguageSelect = (lang) => {
    setLanguage(lang);
    languageRef.current = lang.code;

    if (isListening) {
      // onend will restart listening with the new language
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