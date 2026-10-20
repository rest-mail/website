{{/* The release's name for this chart, bounded by what Kubernetes allows. */}}
{{- define "website.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else if contains .Chart.Name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name .Chart.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{- define "website.selectorLabels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "website.labels" -}}
{{ include "website.selectorLabels" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
helm.sh/chart: {{ printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end -}}

{{- define "website.image" -}}
{{- printf "%s:%s" .Values.image.repository (default .Chart.AppVersion .Values.image.tag) -}}
{{- end -}}

{{/*
The live design, refused at render time if it is not one of the three: the page
would quietly fall back to the default, and a typo would look like a deploy
that did nothing.
*/}}
{{- define "website.design" -}}
{{- $designs := list "safe" "bold" "experimental" -}}
{{- if not (has .Values.design $designs) -}}
{{- fail (printf "design must be one of safe, bold or experimental, not %q" .Values.design) -}}
{{- end -}}
{{- .Values.design -}}
{{- end -}}

{{/*
The contact address, refused at render time if it is not one: it goes into
mailto: links and into security.txt, a file of one field per line.
*/}}
{{- define "website.contact" -}}
{{- if not (regexMatch "^[^\\s@<>()\"',;:]+@[^\\s@<>()\"',;:.]+(\\.[^\\s@<>()\"',;:.]+)+$" (toString .Values.contact)) -}}
{{- fail (printf "contact must be an email address, not %q" (toString .Values.contact)) -}}
{{- end -}}
{{- .Values.contact -}}
{{- end -}}
