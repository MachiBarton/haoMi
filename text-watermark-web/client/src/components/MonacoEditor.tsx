import React from 'react';
import Editor from '@monaco-editor/react';
import { cn } from '@/lib/utils';

interface MonacoEditorProps {
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
  className?: string;
  language?: string;
  original?: string;
}

export const MonacoEditor: React.FC<MonacoEditorProps> = ({
  value,
  onChange,
  height = '300px',
  readOnly = false,
  className,
  language = 'plaintext',
  original,
}) => {
  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      <Editor
        height={height}
        language={language}
        value={value}
        original={original}
        onChange={(value) => onChange?.(value || '')}
        options={{
          readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          automaticLayout: true,
        }}
        theme="vs-light"
      />
    </div>
  );
};

export default MonacoEditor;
