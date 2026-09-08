import { useEffect, useState } from 'react';
import { FolderKanban, Plus } from 'lucide-react';
import { tinyStorage } from '../core/storage';

interface Project {
  id: string;
  name: string;
  status?: string;
  budget?: number;
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    void tinyStorage.get<Project[]>('core.projects.v1').then((value) => {
      setProjects(value ?? []);
    });
  }, []);

  return (
    <div className="tm-page">
      <section className="tm-page-heading">
        <div>
          <span className="tm-eyebrow">Projects</span>
          <h1>پروژه‌ها</h1>
          <p>مرکز مدیریت پروژه‌های ایجاد شده توسط مدیر یا Tiny AI</p>
        </div>
        <button className="tm-primary-button" type="button"><Plus size={17}/> پروژه جدید</button>
      </section>

      <div className="tm-module-list">
        {projects.length === 0 ? (
          <article className="tm-module-row">
            <FolderKanban size={24}/>
            <div>هنوز پروژه‌ای ثبت نشده است.</div>
          </article>
        ) : projects.map((project) => (
          <article className="tm-module-row" key={project.id}>
            <div>
              <h2>{project.name}</h2>
              <p>{project.status ?? 'فعال'} {project.budget ? ` | بودجه: ${project.budget}` : ''}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
