"use client";

import React, { useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { motion } from "framer-motion";
import { Upload, Send, FileText, Link, Check } from "lucide-react";
import { toast } from "sonner";

import {
  GlassmorphicCard,
  GameGenCardPresets,
} from "@/components/ui/GlassmorphicCard";

interface ChallengeSubmissionProps {
  challengeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (submission: SubmissionData) => void;
  submissionType?: "game" | "url" | "file" | "text";
  requirements?: string[];
}

interface SubmissionData {
  title: string;
  description: string;
  type: "game" | "url" | "file" | "text";
  content: string;
  game_id?: string;
  url?: string;
  file_url?: string;
  tags?: string[];
}

export function ChallengeSubmission({
  challengeId,
  isOpen,
  onClose,
  onSubmit,
  submissionType = "game",
  requirements = [],
}: ChallengeSubmissionProps) {
  const [formData, setFormData] = useState<SubmissionData>({
    title: "",
    description: "",
    type: submissionType,
    content: "",
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in all required fields");

      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      toast.success("Submission sent successfully!");
      onClose();
      setFormData({
        title: "",
        description: "",
        type: submissionType,
        content: "",
        tags: [],
      });
      setStep(1);
    } catch (error) {
      toast.error("Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Input
          isRequired
          label="Submission Title"
          placeholder="Enter a catchy title for your submission"
          value={formData.title}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, title: value }))
          }
        />
      </div>

      <div>
        <Textarea
          isRequired
          label="Description"
          minRows={4}
          placeholder="Describe your submission and how it meets the challenge requirements"
          value={formData.description}
          onValueChange={(value) =>
            setFormData((prev) => ({ ...prev, description: value }))
          }
        />
      </div>

      <div>
        <Select
          label="Submission Type"
          selectedKeys={[formData.type]}
          onSelectionChange={(keys) =>
            setFormData((prev) => ({
              ...prev,
              type: Array.from(keys)[0] as any,
            }))
          }
        >
          <SelectItem key="game">Game Project</SelectItem>
          <SelectItem key="url">External Link</SelectItem>
          <SelectItem key="file">File Upload</SelectItem>
          <SelectItem key="text">Text Submission</SelectItem>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      {formData.type === "game" && (
        <div>
          <Select
            label="Select Game"
            placeholder="Choose from your published games"
          >
            <SelectItem key="game1">My Awesome Game</SelectItem>
            <SelectItem key="game2">Puzzle Adventure</SelectItem>
          </Select>
        </div>
      )}

      {formData.type === "url" && (
        <div>
          <Input
            label="Submission URL"
            placeholder="https://..."
            startContent={<Link size={18} />}
            value={formData.url || ""}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, url: value }))
            }
          />
        </div>
      )}

      {formData.type === "file" && (
        <div>
          <div className="border-2 border-dashed border-foreground/20 rounded-lg p-8 text-center hover:border-foreground/40 transition-colors cursor-pointer">
            <Upload className="w-12 h-12 text-foreground/40 mx-auto mb-4" />
            <p className="text-foreground/70 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-foreground/50">Max file size: 100MB</p>
          </div>
        </div>
      )}

      {formData.type === "text" && (
        <div>
          <Textarea
            label="Text Submission"
            minRows={6}
            placeholder="Enter your text submission here..."
            value={formData.content}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, content: value }))
            }
          />
        </div>
      )}

      {requirements.length > 0 && (
        <div className="bg-primary/10 rounded-lg p-4">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <FileText size={16} />
            Challenge Requirements
          </h4>
          <ul className="space-y-1 text-sm text-foreground/70">
            {requirements.map((req, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check
                  className="text-success mt-0.5 flex-shrink-0"
                  size={14}
                />
                {req}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: "bg-transparent",
      }}
      isOpen={isOpen}
      size="2xl"
      onClose={onClose}
    >
      <ModalContent>
        <GlassmorphicCard {...GameGenCardPresets.modalCard}>
          <ModalHeader>
            <div className="flex items-center gap-2">
              <Send className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Submit to Challenge</h2>
                <p className="text-sm text-foreground/60">
                  Step {step} of 2:{" "}
                  {step === 1 ? "Basic Information" : "Submission Content"}
                </p>
              </div>
            </div>
          </ModalHeader>

          <ModalBody>
            <motion.div
              key={step}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
            </motion.div>
          </ModalBody>

          <ModalFooter>
            <div className="flex justify-between w-full">
              <div>
                {step > 1 && (
                  <Button variant="flat" onPress={() => setStep(step - 1)}>
                    Back
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="flat" onPress={onClose}>
                  Cancel
                </Button>

                {step < 2 ? (
                  <Button
                    color="primary"
                    isDisabled={
                      !formData.title.trim() || !formData.description.trim()
                    }
                    onPress={() => setStep(step + 1)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    color="primary"
                    isLoading={loading}
                    startContent={!loading && <Send size={16} />}
                    onPress={handleSubmit}
                  >
                    Submit Entry
                  </Button>
                )}
              </div>
            </div>
          </ModalFooter>
        </GlassmorphicCard>
      </ModalContent>
    </Modal>
  );
}

export default ChallengeSubmission;
