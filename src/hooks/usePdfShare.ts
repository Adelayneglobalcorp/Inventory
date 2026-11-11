import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const usePdfShare = () => {
    const { t } = useTranslation();
    const [isGenerating, setIsGenerating] = useState(false);

    const sharePdf = async (elementId: string, fileName: string) => {
        const element = document.getElementById(elementId);
        if (!element) {
            console.error('Element not found:', elementId);
            return;
        }

        setIsGenerating(true);
        const toastId = toast.loading(t('properties.list.actions.pdfGenerating'));

        try {
            // Capture the element with optimizations
            const canvas = await html2canvas(element, {
                scale: 2, // 2x is enough for 800px width
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                allowTaint: true,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById(elementId);
                    if (clonedElement) {
                        // FORCE A PROFESSIONAL REPORT LAYOUT
                        clonedElement.style.width = '850px'; // Closer to A4 ratio at 96dpi
                        clonedElement.style.margin = '0 auto';
                        clonedElement.style.padding = '60px'; // Professional margins
                        clonedElement.style.backgroundColor = '#ffffff';
                        clonedElement.style.borderRadius = '0px'; // No rounded corners for report
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.position = 'relative';
                        clonedElement.style.display = 'block';
                        clonedElement.style.visibility = 'visible';

                        // CENTER TEXT FOR HEADERS
                        const headers = clonedElement.querySelectorAll('h1, h2, h3, .price-display');
                        headers.forEach((h: any) => h.style.textAlign = 'center');

                        // Hide interactive buttons and markers
                        const toHide = clonedElement.querySelectorAll('button, .action-buttons, [data-pdf-ignore="true"], .lucide-chevron-left, .lucide-chevron-right');
                        toHide.forEach((el: any) => el.style.setProperty('display', 'none', 'important'));

                        // Show PDF-only sections
                        const pdfOnly = clonedElement.querySelectorAll('[data-pdf-only="true"]');
                        pdfOnly.forEach((el: any) => {
                            el.style.setProperty('display', 'block', 'important');
                            el.style.setProperty('visibility', 'visible', 'important');
                        });

                        // FORCE ABSOLUTE BLACK TEXT for all content
                        const allTextElements = clonedElement.querySelectorAll('*');
                        allTextElements.forEach((el: any) => {
                            const style = clonedDoc.defaultView?.getComputedStyle(el);
                            if (style && style.display !== 'none') {
                                // Don't turn badges black if they have specific background colors
                                if (!el.classList.contains('badge') && !el.closest('.Badge') && !el.classList.contains('bg-emerald-500')) {
                                    el.style.setProperty('color', '#000000', 'important');
                                }
                                el.style.setProperty('opacity', '1', 'important');
                                el.style.setProperty('text-shadow', 'none', 'important'); // Remove any glows
                            }
                        });

                        // Make labels look like a form/report
                        const labels = clonedElement.querySelectorAll('.text-muted-foreground, .uppercase');
                        labels.forEach((el: any) => {
                            el.style.setProperty('color', '#333333', 'important');
                            el.style.setProperty('font-weight', '700', 'important');
                            el.style.setProperty('font-size', '12px', 'important');
                        });

                        // Fix Grid Layouts
                        const gridContainers = clonedElement.querySelectorAll('.grid');
                        gridContainers.forEach((grid: any) => {
                            grid.style.display = 'grid';
                            grid.style.gap = '20px';
                            // Normalize grids for 850px width
                            if (grid.classList.contains('grid-cols-3')) grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                            if (grid.classList.contains('md:grid-cols-2')) grid.style.gridTemplateColumns = 'repeat(2, 1fr)';
                            if (grid.classList.contains('lg:grid-cols-3')) grid.style.gridTemplateColumns = 'repeat(3, 1fr)';
                        });

                        // Ensure images are crisp
                        const imgs = clonedElement.querySelectorAll('img');
                        imgs.forEach((img: any) => {
                            img.style.borderRadius = '8px';
                            img.style.border = '1px solid #eeeeee';
                        });
                    }
                }
            });

            // CRITICAL: Check canvas dimensions to avoid jsPDF.scale error
            if (canvas.width === 0 || canvas.height === 0) {
                console.error('Captured canvas has 0 dimensions');
                toast.error(t('properties.list.actions.shareError') + ' Element has 0 dimensions', { id: toastId });
                setIsGenerating(false);
                return;
            }

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: canvas.width > canvas.height ? 'l' : 'p',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });

            pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width / 2, canvas.height / 2);
            const pdfBlob = pdf.output('blob');
            const file = new File([pdfBlob], `${fileName}.pdf`, { type: 'application/pdf' });

            const handleDownloadFallback = () => {
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                toast.success(t('properties.list.actions.shareSuccess'), { id: toastId });
            };

            // Try Sharing (Web Share API)
            // Note: navigator.share might fail if the async PDF generation takes too long,
            // as browsers often require a "transient user activation" (direct result of user click)
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: fileName,
                        text: t('properties.list.actions.shareSuccess')
                    });
                    toast.success(t('properties.list.actions.shareSuccess'), { id: toastId });
                } catch (shareError: any) {
                    console.error('Web Share API failed:', shareError);
                    // If shared was cancelled by user, just dismiss loading
                    if (shareError.name === 'AbortError') {
                        toast.dismiss(toastId);
                    } else {
                        // For other errors (like NotAllowedError due to loss of transient activation),
                        // fallback to download instead of showing an error
                        handleDownloadFallback();
                    }
                }
            } else {
                // Fallback to Download if Share API is not available
                handleDownloadFallback();
            }
        } catch (error: any) {
            console.error('Error generating/sharing PDF:', error);
            toast.error(t('properties.list.actions.shareError') + (error.message || 'Unknown error'), { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return { sharePdf, isGenerating };
};
