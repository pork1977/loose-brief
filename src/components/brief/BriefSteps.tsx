"use client";

import { ChoiceField, CustomAdder, TagField, TextAreaField, TextField, ToggleGroupField } from "@/components/form/fields";
import { LIMITS, type BriefDraft, type BriefField, type FieldErrors } from "@/lib/brief";
import { TRAIT_NAMES } from "@/lib/personality";
import { MaterialsField } from "./MaterialsField";
import styles from "./BriefWorkspace.module.css";

export type StepProps = {
  brief: BriefDraft;
  errors: FieldErrors;
  set: <K extends BriefField>(field: K, value: BriefDraft[K]) => void;
};

const withCustom = (presets: string[], values: string[]) => [...presets, ...values.filter((v) => !presets.includes(v))];

export function ContextStep({ brief, errors, set }: StepProps) {
  return (
    <>
      <TextField
        label="Brand or product name"
        name="name"
        value={brief.name}
        onChange={(v) => set("name", v)}
        max={LIMITS.name}
        placeholder="e.g. Ebbfield"
        error={errors.name}
      />
      <TextField
        label="In one line"
        name="oneLiner"
        optional
        hint="How you'd describe it to someone who asks what you do."
        value={brief.oneLiner}
        onChange={(v) => set("oneLiner", v)}
        max={LIMITS.oneLiner}
        placeholder="e.g. Climate intelligence for coastal communities"
        error={errors.oneLiner}
      />
      <TextAreaField
        label="What does the business do?"
        name="description"
        hint="A few sentences is plenty: what you offer and roughly how it works."
        value={brief.description}
        onChange={(v) => set("description", v)}
        max={LIMITS.description}
        placeholder="e.g. We help small bakeries take online orders without paying marketplace fees."
        error={errors.description}
      />
    </>
  );
}

export function AudienceStep({ brief, errors, set }: StepProps) {
  return (
    <>
      <TagField
        label="Target audience"
        name="audience"
        hint="Add each group separately. Press Enter after each one."
        values={brief.audience}
        onChange={(v) => set("audience", v)}
        maxItems={LIMITS.audience}
        maxLength={LIMITS.tag}
        placeholder="e.g. Local authorities"
        suggestions={["Small businesses", "Local councils", "Researchers", "Parents", "Developers", "Freelancers"]}
        error={errors.audience}
      />
      <TextAreaField
        label="What problem do you solve for them?"
        name="problem"
        value={brief.problem}
        onChange={(v) => set("problem", v)}
        max={LIMITS.problem}
        placeholder="e.g. Planning teams can't see how the coastline is changing until it's already too late."
        error={errors.problem}
      />
    </>
  );
}

export function PersonalityStep({ brief, errors, set }: StepProps) {
  const full = brief.personality.length >= LIMITS.traitsMax;
  return (
    <>
      <ToggleGroupField
        label="Personality traits"
        name="personality"
        hint="Pick three to five. These steer colour, type and tone of voice."
        options={withCustom(TRAIT_NAMES, brief.personality)}
        values={brief.personality}
        onChange={(v) => set("personality", v)}
        maxItems={LIMITS.traitsMax}
        error={errors.personality}
      />
      <CustomAdder
        label="Add your own trait"
        maxLength={LIMITS.tag}
        disabled={full}
        placeholder={full ? "Five picked. Remove one to add another." : "Add your own trait"}
        onAdd={(trait) => {
          if (!brief.personality.some((t) => t.toLowerCase() === trait.toLowerCase())) {
            set("personality", [...brief.personality, trait]);
          }
        }}
      />
    </>
  );
}

const AVOID_PRESETS = [
  "Generic gradients",
  "Stock photography",
  "Neon colours",
  "Script fonts",
  "Glassy see-through panels",
  "Clip art icons",
  "Heavy animation",
  "Alarmist language",
];

function ThemeSwatch({ mode }: { mode: "light" | "dark" | "both" }) {
  return <span className={styles.themeSwatch} data-mode={mode} aria-hidden="true" />;
}

export function VisualStep({ brief, errors, set }: StepProps) {
  return (
    <>
      <ChoiceField
        label="Light mode, dark mode or both?"
        name="theme"
        value={brief.theme}
        onChange={(v) => set("theme", v)}
        error={errors.theme}
        className={styles.themeOptions}
        optionClassName={styles.themeOption}
        options={[
          { value: "light", label: "Light", description: "Pale backgrounds", visual: <ThemeSwatch mode="light" /> },
          { value: "dark", label: "Dark", description: "Deep backgrounds", visual: <ThemeSwatch mode="dark" /> },
          { value: "both", label: "Both", description: "Visitors can switch", visual: <ThemeSwatch mode="both" /> },
        ]}
      />
      <div className={styles.group}>
        <ToggleGroupField
          label="Anything to avoid?"
          name="avoid"
          optional
          options={withCustom(AVOID_PRESETS, brief.avoid)}
          values={brief.avoid}
          onChange={(v) => set("avoid", v)}
          maxItems={LIMITS.avoid}
          error={errors.avoid}
        />
        <CustomAdder
          label="Add something to avoid"
          maxLength={LIMITS.tag}
          disabled={brief.avoid.length >= LIMITS.avoid}
          onAdd={(item) => {
            if (!brief.avoid.includes(item)) set("avoid", [...brief.avoid, item]);
          }}
        />
      </div>
      <TagField
        label="References or competitors"
        name="references"
        optional
        hint="Web addresses or plain descriptions, like 'old railway posters'. Used for feel, never copied."
        values={brief.references}
        onChange={(v) => set("references", v)}
        maxItems={LIMITS.references}
        maxLength={LIMITS.reference}
        placeholder="e.g. https://example.com"
        error={errors.references}
      />
      <MaterialsField materials={brief.materials} />
    </>
  );
}

const ACTION_PRESETS = ["Request a demonstration", "Book a call", "Buy a product", "Sign up", "Get in touch", "Donate"];
const PAGE_PRESETS = ["Home", "Platform", "Pricing", "About", "Case studies", "Blog", "Careers", "Contact", "FAQ"];

export function GoalsStep({ brief, errors, set }: StepProps) {
  const isCustomAction = brief.primaryAction !== "" && !ACTION_PRESETS.includes(brief.primaryAction);
  return (
    <>
      <fieldset className="ui-field" aria-describedby={errors.primaryAction ? "primary-action-error" : undefined}>
        <legend className="ui-label">What should visitors do?</legend>
        <p className="ui-hint">The one action the homepage is built to get.</p>
        <div className="ui-toggles">
          {ACTION_PRESETS.map((action) => (
            <label key={action} className="ui-toggle">
              <input
                type="radio"
                name="primaryAction"
                checked={brief.primaryAction === action}
                onChange={() => set("primaryAction", action)}
              />
              {action}
            </label>
          ))}
          <label className="ui-toggle">
            <input
              type="radio"
              name="primaryAction"
              checked={isCustomAction}
              onChange={() => set("primaryAction", " ")}
            />
            Something else
          </label>
        </div>
        {isCustomAction ? (
          <input
            className="ui-input"
            aria-label="Describe the action"
            value={brief.primaryAction.trimStart()}
            maxLength={LIMITS.tag}
            placeholder="e.g. Join the waiting list"
            autoFocus
            onChange={(e) => set("primaryAction", e.target.value || " ")}
          />
        ) : null}
        {errors.primaryAction ? (
          <p id="primary-action-error" className="ui-error">
            {errors.primaryAction}
          </p>
        ) : null}
      </fieldset>

      <div className={styles.group}>
        <ToggleGroupField
          label="Pages"
          name="pages"
          hint="This version builds the home page. The others appear in its navigation."
          options={withCustom(PAGE_PRESETS, brief.pages)}
          values={brief.pages}
          locked={["Home"]}
          onChange={(v) => set("pages", v.includes("Home") ? v : ["Home", ...v])}
          maxItems={LIMITS.pages}
          error={errors.pages}
        />
        <CustomAdder
          label="Add a page"
          maxLength={LIMITS.tag}
          disabled={brief.pages.length >= LIMITS.pages}
          onAdd={(page) => {
            if (!brief.pages.some((p) => p.toLowerCase() === page.toLowerCase())) set("pages", [...brief.pages, page]);
          }}
        />
      </div>
    </>
  );
}
