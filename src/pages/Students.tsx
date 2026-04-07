import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, UserPlus, Mail, Phone, ShieldCheck, ShieldAlert, Dumbbell, Pencil, Trash2, Building2, Key } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useWorkoutStore } from '../store/workoutStore';
import { useStudentStore } from '../store/studentStore';
import { useTenantStore } from '../store/tenantStore';
import { Student } from '../types';
import AddStudentModal from '../components/AddStudentModal';
import toast from 'react-hot-toast';

export default function Students() {
  const { tenant } = useAuthStore();
  const { plans, fetchPlans } = useWorkoutStore();
  const { students, loading, fetchStudents, fetchAllStudents, softDeleteStudent, updateStudent } = useStudentStore();
  const { tenants, fetchTenants } = useTenantStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const isMaster = tenant?.slug === 'master';

  useEffect(() => {
    if (!tenant) return;

    let unsubscribeStudents: () => void;
    if (isMaster) {
      unsubscribeStudents = fetchAllStudents();
    } else {
      unsubscribeStudents = fetchStudents(tenant.id);
    }
    
    const unsubscribePlans = fetchPlans(tenant.id);
    const unsubscribeTenants = fetchTenants();

    return () => {
      unsubscribeStudents();
      unsubscribePlans();
      unsubscribeTenants();
    };
  }, [tenant, isMaster, fetchStudents, fetchAllStudents, fetchPlans, fetchTenants]);

  const getTenantName = (tenantId: string) => {
    return tenants.find(t => t.id === tenantId)?.name || 'Academia';
  };

  const handleToggleAccess = async (student: Student) => {
    try {
      await updateStudent(student.id, { accessGranted: !student.accessGranted });
      toast.success(student.accessGranted ? 'Acesso revogado' : 'Acesso liberado!');
    } catch (error) {
      toast.error('Erro ao alterar acesso');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja excluir o aluno ${name}? Ele será movido para a lixeira.`)) {
      try {
        await softDeleteStudent(id);
        toast.success('Aluno movido para a lixeira');
      } catch (error) {
        toast.error('Erro ao excluir aluno');
      }
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf.includes(searchTerm)
  );

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!', { duration: 1500 });
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
              <Users size={28} />
            </div>
            Alunos
          </h1>
          <p className="text-brand-muted mt-1">Gerencie os alunos e seus códigos de acesso únicos</p>
        </div>
        <button 
          onClick={() => {
            setEditingStudent(null);
            setIsModalOpen(true);
          }} 
          className="btn-primary flex items-center gap-2 group"
        >
          <UserPlus size={20} className="group-hover:scale-110 transition-transform" />
          Cadastrar Novo Aluno
        </button>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted group-focus-within:text-brand-green transition-colors" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, CPF ou Código ID..."
            className="input-field pl-10 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-secondary flex items-center gap-2 w-full md:w-auto hover:bg-brand-border">
          <Filter size={20} />
          Filtros Avançados
        </button>
      </div>

      <div className="card overflow-hidden p-0 border-brand-border/40 bg-brand-dark/40 backdrop-blur-sm">
        <div className="overflow-x-auto text-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black/50 border-b border-brand-border">
                <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider">Aluno / Contato</th>
                {isMaster && (
                  <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider">Academia</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider text-center">Código ID</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider">Plano</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-brand-muted uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {loading ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5} className="px-6 py-12 text-center text-brand-muted">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-brand-green/30 border-t-brand-green rounded-full animate-spin" />
                      Sincronizando alunos...
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={isMaster ? 6 : 5} className="px-6 py-12 text-center text-brand-muted">
                    <div className="flex flex-col items-center gap-2">
                      <Users size={32} className="opacity-20" />
                      <p>{searchTerm ? 'Nenhum resultado para esta busca.' : 'Sua academia ainda não possui alunos cadastrados.'}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-brand-green/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-brand-border flex items-center justify-center text-brand-muted border border-brand-border shrink-0">
                          {student.photoUrl ? (
                            <img src={student.photoUrl} alt={student.name} className="w-full h-full rounded-2xl object-cover" />
                          ) : (
                            <Users size={24} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-brand-text group-hover:text-brand-green transition-colors">{student.name}</p>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-brand-muted font-medium">
                            <span className="flex items-center gap-1"><Mail size={12} />{student.email}</span>
                            <span className="flex items-center gap-1"><Phone size={12} />{student.phone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    {isMaster && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-brand-muted">
                          <Building2 size={14} className="text-brand-green" />
                          <span className="font-medium">{getTenantName(student.tenantId)}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        {student.accessId ? (
                          <button 
                            onClick={() => copyToClipboard(student.accessId!)}
                            className="bg-brand-black border border-brand-border px-3 py-1.5 rounded-lg flex items-center gap-2 font-mono text-brand-text hover:border-brand-green hover:text-brand-green transition-all group/code"
                            title="Clique para copiar"
                          >
                            <span className="font-bold">{student.accessId}</span>
                            <Key size={14} className="opacity-0 group-hover/code:opacity-100 transition-opacity" />
                          </button>
                        ) : (
                          <span className="text-brand-muted italic opacity-50">Não gerado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-brand-text uppercase text-[11px] bg-brand-border px-2 py-0.5 rounded text-center block w-fit">
                          {student.planId}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-brand-muted">
                          <Dumbbell size={12} className="text-brand-green" />
                          <span>Treino Ativo</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase ${
                          student.status === 'ACTIVE' ? 'bg-brand-green/10 text-brand-green' : 'bg-red-500/10 text-red-500'
                        }`}>
                          {student.status}
                        </span>
                        {student.accessGranted ? (
                          <span className="text-[10px] font-medium text-brand-muted flex items-center gap-1">
                            <ShieldCheck size={12} className="text-brand-green" />
                            LIBERADO
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-brand-muted flex items-center gap-1">
                            <ShieldAlert size={12} className="text-amber-500" />
                            BLOQUEADO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!student.accessGranted && (
                          <button 
                            onClick={() => handleToggleAccess(student)}
                            className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5"
                            title="Liberar Acesso"
                          >
                            <Key size={14} />
                            Liberar
                          </button>
                        )}
                        <button 
                          onClick={() => handleEdit(student)}
                          className="p-2 text-brand-muted hover:text-brand-text hover:bg-brand-border rounded-xl transition-all"
                          title="Editar Ficha"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id, student.name)}
                          className="p-2 text-brand-muted hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                          title="Excluir Aluno"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddStudentModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {}}
        student={editingStudent}
      />
    </div>
  );
}
