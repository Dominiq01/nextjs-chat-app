"use client";
import TextareaAutosize from "react-textarea-autosize";
import { FC, useEffect, useRef, useState } from "react";
import Button from "./ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { MAX_LENGTH } from "@/helpers/constants";

interface MessageInputProps {
  chatPartner: User;
  chatId: string;
}

const MessageInput: FC<MessageInputProps> = ({ chatPartner, chatId }) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [letterCount, setLetterCount] = useState(0);

  useEffect(() => {
    setLetterCount(input.length);
  }, [input]);

  const sendMessage = async () => {
    if (input.trim() === "") {
      return;
    }
    setIsLoading(true);

    try {
      await axios.post("/api/message/send", { text: input, chatId });
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch (error) {
      toast.error("Something went wrong, please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const onTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (input.length >= MAX_LENGTH) {
      setInput(newValue.slice(0, MAX_LENGTH));
      return;
    }
    setInput(newValue);
  };

  const onTextareaPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    const newText = input + pastedText;

    if (newText.length > MAX_LENGTH) {
      e.preventDefault();
      const allowedText = pastedText.slice(0, MAX_LENGTH - input.length);
      setInput(input + allowedText);
    }
  };

  return (
    <div className="border-t border-gray-200 px-4 pt-4 mb-2 sm:mb-0">
      <div className="relative flex-1 overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600">
        <div>
          <TextareaAutosize
            ref={textareaRef}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            rows={1}
            value={input}
            onPaste={onTextareaPaste}
            onChange={onTextareaChange}
            placeholder={`Message ${chatPartner.name}...`}
            className="block w-full resize-none border-0 bg-transparent text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:py-1.5 sm:text-sm sm:leading-6"
          />
        </div>

        <div
          onClick={() => textareaRef.current?.focus()}
          className="py-2"
          aria-hidden="true"
        >
          <div className="py-px">
            <div className="h-9" />
          </div>
        </div>

        <div className="absolute right-0 bottom-0 flex justify-between py-2 pl-3 pr-4">
          <div className="flex-shrink-0">
            <Button isLoading={isLoading} type="submit" onClick={sendMessage}>
              Post
            </Button>
          </div>
        </div>

        <div className="absolute left-0 bottom-0 flex justify-between py-2 pl-3 pr-4">
          <span className="text-gray-400 text-xs">
            {letterCount}/{MAX_LENGTH}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
