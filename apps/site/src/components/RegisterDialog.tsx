import { useState } from 'react';
import { useRegister } from '../hooks/useRegister';

interface RegisterDialogProps {
  onClose: () => void;
}

export const RegisterDialog = ({ onClose }: RegisterDialogProps) => {
  const { mutateAsync, isPending, isSuccess, error } = useRegister();
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const joinSection = document.getElementById('join');
    if (joinSection) {
      joinSection.scrollIntoView({ behavior: 'smooth' });
    }
    onClose();
  };

  return (
    <div className="max-w-lg mx-auto mt-10 bg-slate-900/80 border border-slate-800 rounded-3xl p-8 text-left">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-sm text-indigo-200 uppercase tracking-[0.4em]">Early Access</p>
          <h3 className="text-xl font-semibold mt-2">提交注册，优先体验 GMGN Card</h3>
        </div>
        <button className="text-slate-400 hover:text-slate-200" onClick={onClose} type="button">
          关闭
        </button>
      </div>
      {isSuccess ? (
        <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 rounded-2xl p-4">
          提交成功，直接前往
          <a className="text-emerald-300 underline ml-1" href="/admin">
            管理后台
          </a>
          继续配置。
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <p className="text-sm text-slate-300">
            前往下方 <strong>Join</strong> 区域提交完整资料, 或在后台快速注册账户保留名额
          </p>
          {error && <p className="text-rose-400 text-sm">{error instanceof Error ? error.message : '提交失败'}</p>}
          <button
            className="w-full px-4 py-3 rounded-2xl bg-indigo-500 text-slate-900 font-semibold shadow-lg shadow-indigo-500/25"
            type="submit"
          >
            立即前往
          </button>
        </form>
      )}
    </div>
  );
};
