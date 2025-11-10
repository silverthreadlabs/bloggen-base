'use client';

import { send } from '@emailjs/browser';
import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '../ui/button';

type FormData = {
  name: string;
  email: string;
  company: string;
  budget: string;
  project: string;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

const budgetOptions = [
  { value: '<$5k', label: 'Less than $5,000' },
  { value: '$5k-$15k', label: '$5,000 - $15,000' },
  { value: '$15k-$50k', label: '$15,000 - $50,000' },
  { value: '$50k-$100k', label: '$50,000 - $100,000' },
  { value: '>$100k', label: 'More than $100,000' },
];

export default function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    budget: '',
    project: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  // Input sanitization function
  const sanitizeInput = (input: string): string => {
    return (
      input
        // .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .slice(0, 1000)
    ); // Limit length
  };

  // Email validation
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.project) {
      newErrors.project = 'Project description is required';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const sanitizedValue = name === 'budget' ? value : sanitizeInput(value);

    setFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await send(
        'service_cyapyc8',
        'template_bt2twxe',
        {
          from_name: formData.name,
          from_email: formData.email,
          company: formData.company,
          budget: formData.budget,
          message: formData.project,
        },
        process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY,
      );

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        company: '',
        budget: '',
        project: '',
      });
    } catch (error) {
      // console.error('EmailJS error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h3 className="text-canvas-text-contrast mb-2 text-2xl font-semibold">
          Tell us about your project
        </h3>
        <p className="text-canvas-text">
          Fill out the form below and we'll get back to you within 24 hours.
        </p>
      </div>

      {submitStatus === 'success' && (
        <div className="bg-success-bg border-success-border mb-6 rounded-sm border p-4">
          <p className="text-success-text font-medium">
            Thank you! Your message has been sent successfully. We'll get back
            to you soon.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="bg-alert-bg border-alert-border mb-6 rounded-sm border p-4">
          <p className="text-alert-text font-medium">
            Something went wrong. Please try again or contact us directly.
          </p>
          <Link
            className="text-canvas-text-contrast font-bold underline"
            href="mailto:silverthreadlabs@gmail.com"
          >
            silverthreadlabs@gmail.com
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="font-medium text-sm text-canvas-text"
            >
              Name<span className="text-red-600">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your full name"
              aria-invalid={!!errors.name}
              aria-describedby="name-error"
            />
            {errors.name && (
              <span id="name-error" className="text-xs text-red-600">
                {errors.name}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="email"
              className="font-medium text-sm text-canvas-text"
            >
              Email<span className="text-red-600">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              aria-invalid={!!errors.email}
              aria-describedby="email-error"
            />
            {errors.email && (
              <span id="email-error" className="text-xs text-red-600">
                {errors.email}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="company"
              className="font-medium text-sm text-canvas-text"
            >
              Company
            </label>
            <Input
              id="company"
              name="company"
              type="text"
              value={formData.company}
              onChange={handleInputChange}
              placeholder="Your company name"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="budget"
              className="font-medium text-sm text-canvas-text"
            >
              Budget Range
            </label>
            <Select
              name="budget"
              value={formData.budget}
              onValueChange={(value: string) =>
                handleInputChange({
                  target: { name: 'budget', value },
                } as any)
              }

              // options={budgetOptions}
              // placeholder="Select budget range"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="project"
            className="font-medium text-sm text-canvas-text"
          >
            Project Description<span className="text-red-600">*</span>
          </label>
          <Textarea
            id="project"
            name="project"
            required
            value={formData.project}
            onChange={handleInputChange}
            rows={6}
            placeholder="Tell us about your project, goals, timeline, and any specific requirements..."
            aria-invalid={!!errors.project}
            aria-describedby="project-error"
          />
          {errors.project && (
            <span id="project-error" className="text-xs text-red-600">
              {errors.project}
            </span>
          )}
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Sending..."
            disabled={isSubmitting}
            aria-label="Send Message"
            name="Send Message"
          >
            Send Message
          </Button>
        </div>
      </form>
    </div>
  );
}
